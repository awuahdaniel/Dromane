# # main.py
# # Production-ready Backend for Dromane.ai (Render Free Tier optimized)
# # - No heavy ML models (Torch/Transformers removed)
# # - Groq-only inference
# # - Database persistence for PDFs (No ephemeral storage reliance)

# from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import os
# from pathlib import Path
# from pypdf import PdfReader
# from typing import List, Optional
# from dotenv import load_dotenv
# import research

# # Run initialization checks
# load_dotenv()

# # Modular imports
# from config import GROQ_API_KEY
# from auth import verify_jwt, authenticate_user, create_access_token, register_user, UserLogin, UserRegister
# from research import app as research_app
# from groq import Groq
# from database import get_db_connection

# app = FastAPI(title="Dromane AI Backend (Prod)")

# # ---------------- CONFIGURATION ----------------
# # Initialize Groq client
# groq_client = None
# if GROQ_API_KEY:
#     try:
#         groq_client = Groq(api_key=GROQ_API_KEY)
#     except Exception as e:
#         print(f"Groq Init Error: {e}")

# # CORS configuration (Allow all for development transparency, restrict in strict prod if needed)
# origins = ["*"] # Simplified for immediate success on various domains

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ---------------- DATABASE INIT ----------------
# def ensure_tables():
#     """Ensure necessary tables exist"""
#     conn = get_db_connection()
#     cursor = conn.cursor()
#     try:
#         # PDF Cache Table (Replaces local file storage which is ephemeral on Render)
#         cursor.execute("""
#             CREATE TABLE IF NOT EXISTS pdf_cache (
#                 id INT AUTO_INCREMENT PRIMARY KEY,
#                 user_id INT NOT NULL,
#                 filename VARCHAR(255) NOT NULL,
#                 content MEDIUMTEXT, 
#                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
#                 INDEX idx_user (user_id)
#             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
#         """)
#         conn.commit()
#     except Exception as e:
#         print(f"DB Init Error: {e}")
#     finally:
#         cursor.close()
#         conn.close()

# # Run table check on startup
# try:
#     ensure_tables()
# except:
#     pass # Don't crash if DB not ready immediately

# # ---------------- AUTH ROUTES ----------------
# @app.post("/login", response_model=dict)
# @app.post("/api/auth/login", response_model=dict)
# async def login_for_access_token(form_data: UserLogin):
#     user = authenticate_user(form_data.email, form_data.password)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect username or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     access_token = create_access_token(
#         data={"sub": str(user['id']), "data": {"id": user['id'], "name": user['name'], "email": user['email']}}
#     )
#     return {
#         "access_token": access_token, 
#         "token_type": "bearer", 
#         "token": access_token, 
#         "user": user,
#         "success": True 
#     }

# @app.post("/register")
# async def register(user_data: UserRegister):
#     return register_user(user_data)

# # ---------------- MOUNTS ----------------
# app.mount("/sub", research_app)

# # ---------------- AI ROUTES ----------------

# @app.get("/")
# def read_root():
#     return {
#         "message": "Dromane AI Backend (Production)",
#         "status": "Healthy",
#         "mode": "Groq-Only",
#         "features": ["pdf_upload", "chat", "summarize", "code_explanation", "research"]
#     }

# @app.get("/health/ai")
# def ai_health_check():
#     if not groq_client:
#         raise HTTPException(status_code=503, detail="Groq not configured")
#     return {"status": "ok", "provider": "groq", "model": "llama-3.1-8b-instant"}

# @app.post("/upload")
# async def upload_pdf(file: UploadFile = File(...), user: dict = Depends(verify_jwt)):
#     """Extract text from PDF and store in DB (Persistence)"""
#     if not file.filename.endswith('.pdf'):
#         raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
#     user_id = user.get("id")
    
#     # Process PDF in memory
#     try:
#         content = await file.read()
        
#         # Save to temp file for pypdf (required by library)
#         import tempfile
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
#             tmp.write(content)
#             tmp_path = tmp.name
        
#         # Extract Text
#         reader = PdfReader(tmp_path)
#         text = ""
#         for page in reader.pages:
#             text += page.extract_text() or ""
            
#         os.unlink(tmp_path) # Clean up temp file
        
#         if not text.strip():
#             raise ValueError("PDF empty or unreadable")

#         # Save to Database
#         conn = get_db_connection()
#         cursor = conn.cursor()
        
#         # Check if exists, update; else insert
#         cursor.execute("SELECT id FROM pdf_cache WHERE user_id = %s", (user_id,))
#         existing = cursor.fetchone()
        
#         if existing:
#             cursor.execute(
#                 "UPDATE pdf_cache SET filename=%s, content=%s, updated_at=NOW() WHERE user_id=%s",
#                 (file.filename, text, user_id)
#             )
#         else:
#             cursor.execute(
#                 "INSERT INTO pdf_cache (user_id, filename, content) VALUES (%s, %s, %s)",
#                 (user_id, file.filename, text)
#             )
        
#         conn.commit()
#         cursor.close()
#         conn.close()

#         return {"message": "PDF processed and saved", "filename": file.filename, "length": len(text)}

#     except Exception as e:
#         print(f"Upload error: {e}")
#         raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

# class ChatRequest(BaseModel):
#     question: str

# @app.post("/chat")
# async def chat(request: ChatRequest, user: dict = Depends(verify_jwt)):
#     """Chat with active PDF (Groq Only - Full Text Context)"""
#     if not groq_client:
#         raise HTTPException(status_code=500, detail="Groq API key not configured")

#     user_id = user.get("id")
#     question = request.question
    
#     # Retrieve PDF content from DB
#     context = ""
#     conn = get_db_connection()
#     cursor = conn.cursor()
#     cursor.execute("SELECT content, filename FROM pdf_cache WHERE user_id = %s", (user_id,))
#     row = cursor.fetchone()
#     cursor.close()
#     conn.close()
    
#     system_msg = "You are a highly capable AI research assistant for Dromane.ai."
    
#     if row:
#         pdf_text = row[0]
#         # LLaMA 3.1 8B context is ~128k tokens. 
#         # Safely pass first 30,000 characters (~7k tokens) to be safe and fast.
#         # If text is huge, we might truncate, but for most papers this is plenty.
#         truncated_text = pdf_text[:40000] 
#         system_msg += f"\n\nCONTEXT FROM UPLOADED PDF ({row[1]}):\n{truncated_text}\n\nINSTRUCTION: Answer the user's question based on the PDF context above."
#     else:
#         system_msg += "\n\nNote: No PDF is currently active for this user. Answer from general knowledge."

#     try:
#         response = groq_client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[
#                 {"role": "system", "content": system_msg},
#                 {"role": "user", "content": question}
#             ],
#             temperature=0.7,
#             max_tokens=800
#         )
#         return {"answer": response.choices[0].message.content, "sources": 1 if row else 0}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# class SummarizeRequest(BaseModel):
#     text: Optional[str] = None

# @app.post("/summarize")
# async def summarize_doc(request: SummarizeRequest = None, user: dict = Depends(verify_jwt)):
#     if not groq_client:
#         raise HTTPException(status_code=500, detail="Groq API key not configured")

#     user_id = user.get("id")
#     text_to_summarize = ""

#     if request and request.text:
#         text_to_summarize = request.text
#     else:
#         # Fetch from DB
#         conn = get_db_connection()
#         cursor = conn.cursor()
#         cursor.execute("SELECT content FROM pdf_cache WHERE user_id = %s", (user_id,))
#         row = cursor.fetchone()
#         cursor.close()
#         conn.close()
        
#         if row:
#             text_to_summarize = row[0][:15000] # Limit for summary
#         else:
#             raise HTTPException(status_code=400, detail="No text provided and no document uploaded")
    
#     try:
#         completion = groq_client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[
#                 {"role": "system", "content": "Summarize the following text accurately and concisely."},
#                 {"role": "user", "content": text_to_summarize}
#             ],
#             temperature=0.3,
#             max_tokens=1000
#         )
#         return {"summary": completion.choices[0].message.content}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Groq inference failed: {str(e)}")

# @app.post("/explain-code")
# async def explain_code(request: ChatRequest, user: dict = Depends(verify_jwt)):
#     if not groq_client:
#         raise HTTPException(status_code=500, detail="Groq API key not configured")

#     try:
#         response = groq_client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[
#                 {"role": "system", "content": "You are a senior software engineer. Explain the following code block step-by-step."},
#                 {"role": "user", "content": request.question}
#             ]
#         )
#         return {"answer": response.choices[0].message.content}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Code explanation failed: {str(e)}")

# @app.post("/humanize")
# async def humanize_text(request: ChatRequest, user: dict = Depends(verify_jwt)):
#     if not groq_client:
#         raise HTTPException(status_code=500, detail="Groq API key not configured")

#     try:
#         response = groq_client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[
#                 {"role": "system", "content": "Rewrite the following text to sound more natural and human-like."},
#                 {"role": "user", "content": request.question}
#             ]
#         )
#         return {"answer": response.choices[0].message.content}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Humanize failed: {str(e)}")

# @app.delete("/clear")
# async def clear_documents(user: dict = Depends(verify_jwt)):
#     user_id = user.get("id")
#     conn = get_db_connection()
#     cursor = conn.cursor()
#     cursor.execute("DELETE FROM pdf_cache WHERE user_id = %s", (user_id,))
#     deleted = cursor.rowcount
#     conn.commit()
#     cursor.close()
#     conn.close()
#     return {"message": "State cleared", "items_removed": deleted}

# if __name__ == "__main__":
#     import uvicorn
#     # Single worker for constrained environment
#     uvicorn.run(app, host="0.0.0.0", port=10000, workers=1)

















# research.py
# Perplexity-style research assistant backend using Serper + Groq
# OPTIMIZED FOR RENDER FREE (512MB RAM)

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import requests
import os
from typing import List
from groq import Groq

import main as main_app

# modular imports
from config import SERPER_API_KEY, GROQ_API_KEY
from auth import verify_jwt
from context_manager import ResearchContextManager

if not SERPER_API_KEY:
    print("CRITICAL: SERPER_API_KEY missing")
if not GROQ_API_KEY:
    print("CRITICAL: GROQ_API_KEY missing")

# Initialize Groq Client
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Research Groq Init Error: {e}")

# ---------------- APP ----------------
app = FastAPI(title="Dromane Research API")

# Initialize Context Manager (No embedding model needed)
context_manager = ResearchContextManager()

class ResearchRequest(BaseModel):
    query: str
    session_id: int = None
    reset_context: bool = False

def infer_topic(query: str) -> str:
    # Simple heuristic: first 5 words
    words = query.split()
    return " ".join(words[:5]) + ("..." if len(words) > 5 else "")

@app.post("/api/research")
async def perform_research(req: ResearchRequest, user: dict = Depends(verify_jwt)):
    # Lazy import to save startup memory
    from bs4 import BeautifulSoup
    from newspaper import Article

    user_id = user['id']
    query = req.query.strip()
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # 0️⃣ Context Management
    session_id = req.session_id
    if not session_id or req.reset_context:
        # Create new session or get active one
        session_id = context_manager.get_or_create_session(user_id, infer_topic(query))
    
    # Retrieve relevant context (Last 10 messages + Summary)
    context_packet = context_manager.retrieve_context(session_id, query)
    
    # 1️⃣ Google Search (Serper)
    try:
        search_res = requests.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            json={"q": query, "num": 5}, # Reduced to 5 for speed/token savings
            timeout=10
        )
        search_res.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Search service unavailable: {str(e)}")

    results = search_res.json().get("organic", [])
    if not results:
         raise HTTPException(status_code=404, detail="No search results found")

    sources = []
    headers = {"User-Agent": "Mozilla/5.0"}

    # 2️⃣ Scrape Sources
    for i, r in enumerate(results[:3], 1):
        url = r.get("link")
        title = r.get("title")
        if not url: continue

        text = ""
        try:
            article = Article(url)
            article.download()
            article.parse()
            text = article.text
        except:
            try:
                page = requests.get(url, timeout=5, headers=headers)
                soup = BeautifulSoup(page.text, "html.parser")
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                text = soup.get_text(" ", strip=True)
            except:
                pass

        if len(text) > 200:
            sources.append({
                "id": i,
                "title": title,
                "url": url,
                "content": text[:2000]  # truncate per source
            })

    # Fill remaining sources with snippets if needed
    if len(sources) < 3:
        for i, r in enumerate(results, 1):
            if any(s['url'] == r.get('link') for s in sources):
                continue
            if r.get("snippet"):
                sources.append({
                    "id": i,
                    "title": r.get("title"),
                    "url": r.get("link"),
                    "content": r.get("snippet")
                })
            if len(sources) >= 5: break

    # 3️⃣ Build Prompt with Context
    web_context = ""
    for s in sources:
        web_context += f"SOURCE [{s['id']}] {s['title']}\nURL: {s['url']}\nCONTENT: {s['content']}\n\n"
        
    memory_context = ""
    if context_packet['session_summary']:
        memory_context += f"PREVIOUS SUMMARY:\n{context_packet['session_summary']}\n\n"
    
    if context_packet['recent_entries']:
        memory_context += "\nRECENT CONVERSATION:\n"
        for entry in reversed(context_packet['recent_entries']):
            memory_context += f" User: {entry['query']}\n Assistant: {entry['response'][:200]}...\n"

    # 4️⃣ Perplexity-style system prompt
    system_prompt = """You are Dromane, a persistent and intelligent research assistant.
Your goal is to provide a comprehensive, well-cited answer to the user's query, utilizing the provided web sources and maintaining continuity with the previous conversation.

INSTRUCTIONS (Perplexity-style format):
1. Synthesize information from all WEB SOURCES.
2. Incorporate MEMORY CONTEXT to answer follow-ups and maintain continuity.
3. Cite sources clearly using [1], [2], etc., corresponding to Source IDs.
4. For questions outside the sources, provide an informed answer and indicate it is not from the sources.
5. Structure responses using headings, bullet points, or numbered lists where appropriate.
6. Highlight key points or conclusions for easy reading.
7. Be concise but thorough, avoiding unnecessary repetition.
8. Optional: Include examples or clarifications if they help explain the answer.
"""

    user_prompt = f"""MEMORY CONTEXT:
{memory_context}

CURRENT WEB SOURCES:
{web_context}

USER QUERY:
{query}
"""

    # 5️⃣ Ask Groq
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )

        answer = completion.choices[0].message.content

        # Store Result
        context_manager.store_entry(session_id, query, answer, sources=len(sources))
        context_manager.update_session_topic_if_needed(session_id, query)

    except Exception as e:
        error_str = str(e)
        print(f"Groq Research Error: {error_str}")
        raise HTTPException(status_code=500, detail=f"AI Research failed: {error_str}")

    return {
        "answer": answer,
        "sources": [{"id": s["id"], "title": s["title"], "url": s["url"]} for s in sources],
        "session_id": session_id,
        "topic": context_packet.get('primary_topic', infer_topic(query))
    }

@app.get("/api/research/sessions")
async def get_sessions(user: dict = Depends(verify_jwt)):
    """Get all research sessions for the user"""
    return context_manager.get_user_sessions(user['id'])
