# research.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import requests
from typing import List, Optional
from groq import Groq

# modular imports
from config import SERPER_API_KEY, GROQ_API_KEY
from auth import verify_jwt
from context_manager import ResearchContextManager

router = APIRouter(prefix="/api", tags=["research"])

# ----------------------
# Groq Client
# ----------------------
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Research Groq Init Error: {e}")

# ----------------------
# Context Manager
# ----------------------
context_manager = ResearchContextManager()

# ----------------------
# Models
# ----------------------
class ResearchRequest(BaseModel):
    query: str
    session_id: Optional[int] = None
    reset_context: bool = False

# ----------------------
# Helper
# ----------------------
def infer_topic(query: str) -> str:
    words = query.split()
    return " ".join(words[:5]) + ("..." if len(words) > 5 else "")

# ----------------------
# Routes
# ----------------------
@router.post("/research")
async def perform_research(req: ResearchRequest, user: dict = Depends(verify_jwt)):
    from bs4 import BeautifulSoup
    from newspaper import Article

    user_id = user['id']
    query = req.query.strip()
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Session handling
    session_id = req.session_id
    if not session_id or req.reset_context:
        session_id = context_manager.get_or_create_session(user_id, infer_topic(query))
    
    context_packet = context_manager.retrieve_context(session_id, query)

    # ----------------------
    # Google Search (Serper)
    # ----------------------
    try:
        search_res = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"},
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

    # ----------------------
    # Scrape Sources
    # ----------------------
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

    # Fallback snippets if sources < 3
    if len(sources) < 3:
        for i, r in enumerate(results, 1):
            if any(s['url'] == r.get('link') for s in sources):
                continue
            snippet = r.get("snippet")
            if snippet:
                sources.append({"id": i, "title": r.get("title"), "url": r.get("link"), "content": snippet})
            if len(sources) >= 5: break

    # ----------------------
    # Build Prompt
    # ----------------------
    web_context = ""
    for s in sources:
        web_context += f"SOURCE [{s['id']}] {s['title']}\nURL: {s['url']}\nCONTENT: {s['content']}\n\n"

    memory_context = ""
    if context_packet.get('session_summary'):
        memory_context += f"PREVIOUS SUMMARY:\n{context_packet['session_summary']}\n\n"
    if context_packet.get('recent_entries'):
        memory_context += "\nRECENT CONVERSATION:\n"
        for entry in reversed(context_packet['recent_entries']):
            memory_context += f" User: {entry['query']}\n Assistant: {entry['response'][:200]}...\n"

    system_prompt = """You are Dromane, a persistent and intelligent research assistant.
Use the web sources and memory context to answer thoroughly and cite sources with [1], [2] notation.
Be concise but thorough."""

    user_prompt = f"""MEMORY CONTEXT:
{memory_context}

CURRENT WEB SOURCES:
{web_context}

USER QUERY:
{query}
"""

    # ----------------------
    # Groq AI call
    # ----------------------
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

        # Store session context
        context_manager.store_entry(session_id, query, answer, sources=len(sources))
        context_manager.update_session_topic_if_needed(session_id, query)

    except Exception as e:
        print(f"Groq Research Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Research failed: {str(e)}")

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

@router.delete("/research/sessions/{session_id}")
async def delete_session(session_id: int, user: dict = Depends(verify_jwt)):
    """Delete a research session and its history"""
    if context_manager.delete_session(session_id, user['id']):
        return {"message": "Session deleted successfully"}
    raise HTTPException(status_code=404, detail="Session not found or unauthorized")
