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

class ResearchRequest(BaseModel):
    query: str

# ---------------- ROUTE ----------------
@app.post("/api/research")
async def perform_research(req: ResearchRequest):
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # 1️⃣ Google Search (Serper)
    try:
        search_res = requests.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            json={"q": query, "num": 8},
            timeout=10
        )
        search_res.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Search service unavailable: {str(e)}")

    results = search_res.json().get("organic", [])
    if not results:
         raise HTTPException(status_code=404, detail="No search results found")

    sources = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

    # 2️⃣ Scrape Sources
    for i, r in enumerate(results, 1):
        url = r.get("link")
        title = r.get("title")
        if not url:
            continue

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
                "content": text[:1800] # Increased context window slightly
            })

    if not sources:
        raise HTTPException(404, "No readable sources found")

    # 3️⃣ Build Context
    context = ""
    for s in sources:
        context += f"[{s['id']}] {s['title']}\n{s['content']}\n\n"

    # 4️⃣ Ask Groq (LLaMA-3.1-8B-Instruct)
    print("Calling Groq llama-3.1-8b-instant...")
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a research assistant for students. Answer the user's question based ONLY on the provided sources. Cite sources using [1], [2], etc."
                },
                {
                    "role": "user",
                    "content": f"Question: {query}\n\nSources:\n{context}"
                }
            ],
            temperature=0.3,
            max_tokens=1000
        )

        answer = completion.choices[0].message.content

    except Exception as e:
        # FAIL LOUDLY with more detail
        error_str = str(e)
        print(f"Groq Research Error: {error_str}")
        
        # Check if it's a 403 specifically
        status_code = 500
        if "403" in error_str:
            status_code = 403
            
        raise HTTPException(
            status_code=status_code,
            detail=f"Groq AI rejected the research request. This usually means the API key is restricted, the prompt is too large for your tier, or your IP/Region is blocked by Groq. Error: {error_str}"
        )

    # 5️⃣ Response
    return {
        "answer": answer,
        "sources": [
            {"id": s["id"], "title": s["title"], "url": s["url"]}
            for s in sources
        ],
        "source_count": len(sources)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
