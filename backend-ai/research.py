# research.py
# This module implements the Perplexity-style research assistant backend.
# It handles web searching via Serper, article scraping, and context preparation.

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
import requests
import os
from bs4 import BeautifulSoup
from newspaper import Article
from typing import List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# --- Step 1: Environment Variable Handling ---
# We load the .env file from the backend folder to ensure API keys are accessible.
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

SERPER_API_KEY = os.getenv("SERPER_API_KEY")
# Optional key - handled gracefully in case the user wants to fallback to OpenAI later
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SERPER_API_KEY:
    # Fail immediately if the critical research engine key is missing.
    raise ValueError("CRITICAL ERROR: SERPER_API_KEY not found in .env file. "
                     "Please add it to backend-ai/.env to use the Research feature.")

# --- Step 2: FastAPI Setup ---
# Defining a top-level app instance allows running this module standalone via:
# uvicorn research:app --reload
app = FastAPI(title="Dromane Research API")

class ResearchRequest(BaseModel):
    query: str

@app.post("/api/research")
async def perform_research(request: ResearchRequest):
    """
    Research logic:
    1. Search Google via Serper API.
    2. Extract clean article text from the top 8 sources.
    3. Return a structured list of sources and a placeholder answer.
    """
    query = request.query
    
    # 1. Serper API Call
    search_url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    # Requesting top 8 results for a rich context
    payload = {"q": query, "num": 8}
    
    try:
        search_response = requests.post(search_url, headers=headers, json=payload, timeout=10)
        search_response.raise_for_status()
        search_data = search_response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail=f"Google Search Service (Serper) is currently unavailable: {str(e)}"
        )
    
    organic_results = search_data.get("organic", [])
    
    # 2. Scraping and Content Extraction
    sources = []
    
    for idx, item in enumerate(organic_results, 1):
        url = item.get("link")
        title = item.get("title")
        if not url:
            continue
            
        content = ""
        try:
            # Primary: Higher quality extraction using newspaper3k
            article = Article(url)
            article.download()
            article.parse()
            content = article.text
        except Exception:
            # Secondary: Fallback to BeautifulSoup if newspaper3k fails
            try:
                r = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
                soup = BeautifulSoup(r.text, "html.parser")
                # Remove common noise before extracting text
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                content = soup.get_text(separator=' ', strip=True)
            except Exception:
                content = ""
        
        # Only include sources with enough character content to be useful
        if len(content.strip()) > 200:
            # Limit to 2000 characters as per requirements
            sources.append({
                "id": idx,
                "title": title,
                "url": url,
                "snippet": content[:2000] 
            })
    
    if not sources:
        raise HTTPException(
            status_code=404, 
            detail="Research failed: No readable sources found for this query."
        )
    
    # 3. Structured JSON Response
    return {
        "answer": f"I have analyzed {len(sources)} sources regarding '{query}'. [AI reasoning will be integrated here].",
        "sources": [{"id": s["id"], "title": s["title"], "url": s["url"]} for s in sources],
        "source_count": len(sources)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
