# main.py
# Production-ready Backend for Dromane.ai (Render Free Tier optimized)
# - No heavy ML models (Torch/Transformers removed)
# - Groq-only inference
# - Database persistence for PDFs (No ephemeral storage reliance)

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from pathlib import Path
from pypdf import PdfReader
from typing import List, Optional
from dotenv import load_dotenv

# Run initialization checks
load_dotenv()

# Modular imports
from config import GROQ_API_KEY
from auth import verify_jwt, authenticate_user, create_access_token, register_user, UserLogin, UserRegister
from research import app as research_app
from groq import Groq
from database import get_db_connection

app = FastAPI(title="Dromane AI Backend (Prod)")

# ---------------- CONFIGURATION ----------------
# Initialize Groq client
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Groq Init Error: {e}")

# CORS configuration (Allow all for development transparency, restrict in strict prod if needed)
origins = ["*"] # Simplified for immediate success on various domains

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE INIT ----------------
def ensure_tables():
    """Ensure necessary tables exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # PDF Cache Table (Replaces local file storage which is ephemeral on Render)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pdf_cache (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                content MEDIUMTEXT, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)
        conn.commit()
    except Exception as e:
        print(f"DB Init Error: {e}")
    finally:
        cursor.close()
        conn.close()

# Run table check on startup
try:
    ensure_tables()
except:
    pass # Don't crash if DB not ready immediately

# ---------------- AUTH ROUTES ----------------
@app.post("/login", response_model=dict)
@app.post("/api/auth/login", response_model=dict)
async def login_for_access_token(form_data: UserLogin):
    user = authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": str(user['id']), "data": {"id": user['id'], "name": user['name'], "email": user['email']}}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "token": access_token, 
        "user": user,
        "success": True 
    }

@app.post("/register")
async def register(user_data: UserRegister):
    return register_user(user_data)

# ---------------- MOUNTS ----------------
app.mount("/sub", research_app)

# ---------------- AI ROUTES ----------------

@app.get("/")
def read_root():
    return {
        "message": "Dromane AI Backend (Production)",
        "status": "Healthy",
        "mode": "Groq-Only",
        "features": ["pdf_upload", "chat", "summarize", "code_explanation", "research"]
    }

@app.get("/health/ai")
def ai_health_check():
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq not configured")
    return {"status": "ok", "provider": "groq", "model": "llama-3.1-8b-instant"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), user: dict = Depends(verify_jwt)):
    """Extract text from PDF and store in DB (Persistence)"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    user_id = user.get("id")
    
    # Process PDF in memory
    try:
        content = await file.read()
        
        # Save to temp file for pypdf (required by library)
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Extract Text
        reader = PdfReader(tmp_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
            
        os.unlink(tmp_path) # Clean up temp file
        
        if not text.strip():
            raise ValueError("PDF empty or unreadable")

        # Save to Database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if exists, update; else insert
        cursor.execute("SELECT id FROM pdf_cache WHERE user_id = %s", (user_id,))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute(
                "UPDATE pdf_cache SET filename=%s, content=%s, updated_at=NOW() WHERE user_id=%s",
                (file.filename, text, user_id)
            )
        else:
            cursor.execute(
                "INSERT INTO pdf_cache (user_id, filename, content) VALUES (%s, %s, %s)",
                (user_id, file.filename, text)
            )
        
        conn.commit()
        cursor.close()
        conn.close()

        return {"message": "PDF processed and saved", "filename": file.filename, "length": len(text)}

    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
async def chat(request: ChatRequest, user: dict = Depends(verify_jwt)):
    """Chat with active PDF (Groq Only - Full Text Context)"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    user_id = user.get("id")
    question = request.question
    
    # Retrieve PDF content from DB
    context = ""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT content, filename FROM pdf_cache WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    system_msg = "You are a highly capable AI research assistant for Dromane.ai."
    
    if row:
        pdf_text = row[0]
        # LLaMA 3.1 8B context is ~128k tokens. 
        # Safely pass first 30,000 characters (~7k tokens) to be safe and fast.
        # If text is huge, we might truncate, but for most papers this is plenty.
        truncated_text = pdf_text[:40000] 
        system_msg += f"\n\nCONTEXT FROM UPLOADED PDF ({row[1]}):\n{truncated_text}\n\nINSTRUCTION: Answer the user's question based on the PDF context above."
    else:
        system_msg += "\n\nNote: No PDF is currently active for this user. Answer from general knowledge."

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": question}
            ],
            temperature=0.7,
            max_tokens=800
        )
        return {"answer": response.choices[0].message.content, "sources": 1 if row else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

class SummarizeRequest(BaseModel):
    text: Optional[str] = None

@app.post("/summarize")
async def summarize_doc(request: SummarizeRequest = None, user: dict = Depends(verify_jwt)):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    user_id = user.get("id")
    text_to_summarize = ""

    if request and request.text:
        text_to_summarize = request.text
    else:
        # Fetch from DB
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT content FROM pdf_cache WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if row:
            text_to_summarize = row[0][:15000] # Limit for summary
        else:
            raise HTTPException(status_code=400, detail="No text provided and no document uploaded")
    
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Summarize the following text accurately and concisely."},
                {"role": "user", "content": text_to_summarize}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        return {"summary": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq inference failed: {str(e)}")

@app.post("/explain-code")
async def explain_code(request: ChatRequest, user: dict = Depends(verify_jwt)):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a senior software engineer. Explain the following code block step-by-step."},
                {"role": "user", "content": request.question}
            ]
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code explanation failed: {str(e)}")

@app.post("/humanize")
async def humanize_text(request: ChatRequest, user: dict = Depends(verify_jwt)):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Rewrite the following text to sound more natural and human-like."},
                {"role": "user", "content": request.question}
            ]
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Humanize failed: {str(e)}")

@app.delete("/clear")
async def clear_documents(user: dict = Depends(verify_jwt)):
    user_id = user.get("id")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pdf_cache WHERE user_id = %s", (user_id,))
    deleted = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "State cleared", "items_removed": deleted}

if __name__ == "__main__":
    import uvicorn
    # Single worker for constrained environment
    uvicorn.run(app, host="0.0.0.0", port=10000, workers=1)
