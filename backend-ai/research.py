# research.py
# Perplexity-style research assistant backend using Serper + Groq

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
from pathlib import Path
from newspaper import Article
from bs4 import BeautifulSoup
from typing import List
from groq import Groq

# modular imports
from config import SERPER_API_KEY, GROQ_API_KEY

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

# Initialize Context Manager
# Import here to avoid circular dependencies if possible, or assume it's available
from context_manager import ResearchContextManager
# We need to get the embed_model from main.py or initialize it here. 
# For now, let's initialize a new one or try to import it. 
# Best practice: Initialize a single instance in main and pass it, but since this is mounted, 
# we might need to rely on a shared module or re-init.
# Re-initializing SentenceTransformer is heavy (200MB+), so let's try to import from main 
# BUT main imports research, so we have a circular import risk.
# SOLUTION: Move embed_model to a separate singleton file or initialize inside research.py if standalone.
# For this implementation, we will initialize it here lazily or import from a new `ai_engine.py` if we had one.
# Let's simplify and use the one we just imported if we can, or init a lightweight one.
from sentence_transformers import SentenceTransformer
embed_model = None
try:
    print("Research: Loading embedding model...")
    embed_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
    print("Research: Embedding model loaded.")
except Exception as e:
    print(f"Research warning: Embedding model failed {e}")

context_manager = ResearchContextManager(embed_model)

class ResearchRequest(BaseModel):
    query: str
    session_id: int = None
    reset_context: bool = False

# ---------------- ROUTE ----------------
from fastapi import Depends
from auth import verify_jwt

def infer_topic(query: str) -> str:
    # Simple heuristic: first 5 words
    words = query.split()
    return " ".join(words[:5]) + ("..." if len(words) > 5 else "")

@app.post("/api/research")
async def perform_research(req: ResearchRequest, user: dict = Depends(verify_jwt)):
    user_id = user['id']
    query = req.query.strip()
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # 0️⃣ Context Management
    session_id = req.session_id
    if not session_id or req.reset_context:
        # Create new session or get active one
        session_id = context_manager.get_or_create_session(user_id, infer_topic(query))
    
    # Retrieve relevant context
    context_packet = context_manager.retrieve_context(session_id, query)
    
    # 1️⃣ Google Search (Serper)
    try:
        search_res = requests.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            json={"q": query, "num": 6}, # Reduced slightly to save tokens
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
    for i, r in enumerate(results, 1):
        url = r.get("link")
        title = r.get("title")
        if not url: continue

        text = ""
        try:
            # Method A: Newspaper3k
            article = Article(url)
            article.download()
            article.parse()
            text = article.text
        except:
            # Method B: Requests + BeautifulSoup Fallback
            try:
                page = requests.get(url, timeout=5, headers=headers)
                soup = BeautifulSoup(page.text, "html.parser")
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                text = soup.get_text(" ", strip=True)
            except:
                pass

        if len(text) > 300:
            sources.append({
                "id": i,
                "title": title,
                "url": url,
                "content": text[:1500] 
            })

    if not sources:
        # If scraping failed, use snippets from Serper
        print("Scraping failed, using snippets")
        for i, r in enumerate(results, 1):
             if r.get("snippet"):
                sources.append({
                    "id": i,
                    "title": r.get("title"),
                    "url": r.get("link"),
                    "content": r.get("snippet")
                })

    # 3️⃣ Build Prompt with Context
    
    # Build Web Context
    web_context = ""
    for s in sources:
        web_context += f"[{s['id']}] {s['title']}\n{s['content']}\n\n"
        
    # Build Memory Context
    memory_context = ""
    if context_packet['session_summary']:
        memory_context += f"RESEARCH SUMMARY:\n{context_packet['session_summary']}\n\n"
    
    if context_packet['similar_entries']:
        memory_context += "RELEVANT PAST FINDINGS:\n"
        for entry in context_packet['similar_entries']:
            memory_context += f"- Q: {entry['query']}\n  A: {entry['response'][:200]}...\n"
    
    if context_packet['recent_entries']:
        memory_context += "\nRECENT CONVERSATION:\n"
        for entry in reversed(context_packet['recent_entries']): # Show in chronological order for flow
            memory_context += f" User: {entry['query']}\n Assistant: {entry['response'][:150]}...\n"

    system_prompt = """You are Dromane, a persistent and intelligent research assistant.
Your goal is to provide a comprehensive, well-cited answer to the user's query, while maintaining continuity with previous research.

INSTRUCTIONS:
1. Synthesize information from the provided WEB SOURCES.
2. If the user's query is a follow-up (e.g., "tell me more", "what about X?"), use the MEMORY CONTEXT to understand what they are referring to.
3. Cite your sources using [1], [2] notation.
4. Be professional, academic yet accessible.
5. If the new information contradicts past findings, explicitly note the specific difference.
"""

    user_prompt = f"""MEMORY CONTEXT:
{memory_context}

CURRENT WEB SOURCES:
{web_context}

USER QUERY:
{query}
"""

    # 4️⃣ Ask Groq
    print("Calling Groq Research...")
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=1200
        )

        answer = completion.choices[0].message.content

        # 5️⃣ Store Result in Memory
        context_manager.store_entry(session_id, query, answer, sources=len(sources))
        
        # Update topic if it's still generic
        context_manager.update_session_topic_if_needed(session_id, query)

    except Exception as e:
        error_str = str(e)
        print(f"Groq Research Error: {error_str}")
        raise HTTPException(status_code=500, detail=f"AI Research failed: {error_str}")

    # 6️⃣ Response
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
