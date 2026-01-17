# # research.py
# # Perplexity-style research assistant backend using Serper + Groq
# # OPTIMIZED FOR RENDER FREE (512MB RAM)

# from fastapi import FastAPI, HTTPException, Depends
# from pydantic import BaseModel
# import requests
# import os
# from typing import List
# from groq import Groq
# import main as main_app

# # modular imports
# from config import SERPER_API_KEY, GROQ_API_KEY
# from auth import verify_jwt
# from context_manager import ResearchContextManager

# if not SERPER_API_KEY:
#     print("CRITICAL: SERPER_API_KEY missing")
# if not GROQ_API_KEY:
#     print("CRITICAL: GROQ_API_KEY missing")

# # Initialize Groq Client
# groq_client = None
# if GROQ_API_KEY:
#     try:
#         groq_client = Groq(api_key=GROQ_API_KEY)
#     except Exception as e:
#         print(f"Research Groq Init Error: {e}")

# # ---------------- APP ----------------
# app = FastAPI(title="Dromane Research API")

# # Initialize Context Manager (No embedding model needed)
# context_manager = ResearchContextManager()

# class ResearchRequest(BaseModel):
#     query: str
#     session_id: int = None
#     reset_context: bool = False

# def infer_topic(query: str) -> str:
#     # Simple heuristic: first 5 words
#     words = query.split()
#     return " ".join(words[:5]) + ("..." if len(words) > 5 else "")

# @app.post("/api/research")
# async def perform_research(req: ResearchRequest, user: dict = Depends(verify_jwt)):
#     # Lazy import to save startup memory
#     from bs4 import BeautifulSoup
#     from newspaper import Article

#     user_id = user['id']
#     query = req.query.strip()
    
#     if not query:
#         raise HTTPException(status_code=400, detail="Query cannot be empty")

#     # 0️⃣ Context Management
#     session_id = req.session_id
#     if not session_id or req.reset_context:
#         # Create new session or get active one
#         session_id = context_manager.get_or_create_session(user_id, infer_topic(query))
    
#     # Retrieve relevant context (Last 10 messages + Summary)
#     context_packet = context_manager.retrieve_context(session_id, query)
    
#     # 1️⃣ Google Search (Serper)
#     try:
#         search_res = requests.post(
#             "https://google.serper.dev/search",
#             headers={
#                 "X-API-KEY": SERPER_API_KEY,
#                 "Content-Type": "application/json"
#             },
#             json={"q": query, "num": 5}, # Reduced to 5 for speed/token savings
#             timeout=10
#         )
#         search_res.raise_for_status()
#     except Exception as e:
#         raise HTTPException(status_code=503, detail=f"Search service unavailable: {str(e)}")

#     results = search_res.json().get("organic", [])
#     if not results:
#          raise HTTPException(status_code=404, detail="No search results found")

#     sources = []
#     headers = {"User-Agent": "Mozilla/5.0"}

#     # 2️⃣ Scrape Sources
#     # We limit to top 3 for deep scraping to save time/memory/tokens
#     for i, r in enumerate(results[:3], 1):
#         url = r.get("link")
#         title = r.get("title")
#         if not url: continue

#         text = ""
#         try:
#             # Method A: Newspaper3k
#             article = Article(url)
#             article.download()
#             article.parse()
#             text = article.text
#         except:
#             # Method B: Requests + BeautifulSoup Fallback
#             try:
#                 page = requests.get(url, timeout=5, headers=headers)
#                 soup = BeautifulSoup(page.text, "html.parser")
#                 for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
#                     tag.decompose()
#                 text = soup.get_text(" ", strip=True)
#             except:
#                 pass

#         if len(text) > 200:
#             sources.append({
#                 "id": i,
#                 "title": title,
#                 "url": url,
#                 "content": text[:2000] # Truncate per source
#             })

#     # If scraping yielded too little, use snippets for the rest/all
#     if len(sources) < 3:
#         for i, r in enumerate(results, 1):
#             # check if already added
#             if any(s['url'] == r.get('link') for s in sources):
#                 continue
            
#             if r.get("snippet"):
#                 sources.append({
#                     "id": i,
#                     "title": r.get("title"),
#                     "url": r.get("link"),
#                     "content": r.get("snippet")
#                 })
#             if len(sources) >= 5: break

#     # 3️⃣ Build Prompt with Context
    
#     # Build Web Context
#     web_context = ""
#     for s in sources:
#         web_context += f"SOURCE [{s['id']}] {s['title']}\nURL: {s['url']}\nCONTENT: {s['content']}\n\n"
        
#     # Build Memory Context
#     memory_context = ""
#     if context_packet['session_summary']:
#         memory_context += f"PREVIOUS SUMMARY:\n{context_packet['session_summary']}\n\n"
    
#     if context_packet['recent_entries']:
#         memory_context += "\nRECENT CONVERSATION:\n"
#         for entry in reversed(context_packet['recent_entries']): # Show in chronological order
#             memory_context += f" User: {entry['query']}\n Assistant: {entry['response'][:200]}...\n"

#     system_prompt = """You are Dromane, a persistent and intelligent research assistant.
# Your goal is to provide a comprehensive, well-cited answer to the user's query, utilizing the provided web sources and maintaining continuity with the previous conversation.

# INSTRUCTIONS:
# 1. Synthesize information from the provided WEB SOURCES.
# 2. Use the MEMORY CONTEXT to answer follow-up questions or refer back to previous topics.
# 3. Cite your sources using [1], [2] notation corresponding to the Source IDs.
# 4. If the user asks a question not covered by the sources, use your general knowledge but mention that it is not from the provided sources.
# 5. Be concise but thorough."""

#     user_prompt = f"""MEMORY CONTEXT:
# {memory_context}

# CURRENT WEB SOURCES:
# {web_context}

# USER QUERY:
# {query}
# """

#     # 4️⃣ Ask Groq
#     try:
#         completion = groq_client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[
#                 {"role": "system", "content": system_prompt},
#                 {"role": "user", "content": user_prompt}
#             ],
#             temperature=0.3,
#             max_tokens=1000
#         )

#         answer = completion.choices[0].message.content

#         # 5️⃣ Store Result in Memory
#         context_manager.store_entry(session_id, query, answer, sources=len(sources))
        
#         # Update topic if it's still generic
#         context_manager.update_session_topic_if_needed(session_id, query)

#     except Exception as e:
#         error_str = str(e)
#         print(f"Groq Research Error: {error_str}")
#         raise HTTPException(status_code=500, detail=f"AI Research failed: {error_str}")

#     # 6️⃣ Response
#     return {
#         "answer": answer,
#         "sources": [{"id": s["id"], "title": s["title"], "url": s["url"]} for s in sources],
#         "session_id": session_id,
#         "topic": context_packet.get('primary_topic', infer_topic(query))
#     }

# @app.get("/api/research/sessions")
# async def get_sessions(user: dict = Depends(verify_jwt)):
#     """Get all research sessions for the user"""
#     return context_manager.get_user_sessions(user['id'])


# research.py
# Perplexity-style research assistant backend using Serper + Groq
# OPTIMIZED FOR RENDER FREE (512MB RAM)

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import requests
from typing import List
from groq import Groq

# modular imports
from config import SERPER_API_KEY, GROQ_API_KEY
from auth import verify_jwt
from context_manager import ResearchContextManager

# ---------------- Router ----------------
router = APIRouter(prefix="/api", tags=["research"])

# Initialize Groq Client
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Research Groq Init Error: {e}")

# Initialize Context Manager
context_manager = ResearchContextManager()

# ---------------- Models ----------------
class ResearchRequest(BaseModel):
    query: str
    session_id: int = None
    reset_context: bool = False

# ---------------- Helper ----------------
def infer_topic(query: str) -> str:
    words = query.split()
    return " ".join(words[:5]) + ("..." if len(words) > 5 else "")

# ---------------- Routes ----------------
@router.post("/research")
async def perform_research(req: ResearchRequest, user: dict = Depends(verify_jwt)):
    from bs4 import BeautifulSoup
    from newspaper import Article

    user_id = user['id']
    query = req.query.strip()
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Context Management
    session_id = req.session_id
    if not session_id or req.reset_context:
        session_id = context_manager.get_or_create_session(user_id, infer_topic(query))
    
    context_packet = context_manager.retrieve_context(session_id, query)

    # 1️⃣ Google Search (Serper)
    try:
        search_res = requests.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            json={"q": query, "num": 5},
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
                "content": text[:2000]
            })

    # Fallback to snippets if not enough
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

    system_prompt = """You are Dromane, a persistent and intelligent research assistant.
Your goal is to provide a comprehensive, well-cited answer to the user's query, utilizing the provided web sources and maintaining continuity with the previous conversation.

INSTRUCTIONS:
1. Synthesize information from the provided WEB SOURCES.
2. Use the MEMORY CONTEXT to answer follow-up questions or refer back to previous topics.
3. Cite your sources using [1], [2] notation corresponding to the Source IDs.
4. If the user asks a question not covered by the sources, use your general knowledge but mention that it is not from the provided sources.
5. Be concise but thorough."""

    user_prompt = f"""MEMORY CONTEXT:
{memory_context}

CURRENT WEB SOURCES:
{web_context}

USER QUERY:
{query}
"""

    # 4️⃣ Ask Groq
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

        # Store in Memory
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

@router.get("/research/sessions")
async def get_sessions(user: dict = Depends(verify_jwt)):
    """Get all research sessions for the user"""
    return context_manager.get_user_sessions(user['id'])
