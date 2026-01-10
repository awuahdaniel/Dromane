# research.py
# Perplexity-style research assistant backend using Serper + Hugging Face with Fallback

# from fastapi import FastAPI, HTTPException, status
# from pydantic import BaseModel
# import requests
# import os
# import httpx
# import json
# import logging
# from bs4 import BeautifulSoup
# from newspaper import Article
# from typing import List, Optional
# from dotenv import load_dotenv
# from pathlib import Path
# import asyncio

# # -------------------- ENV SETUP --------------------
# # Load environment variables
# env_path = Path(__file__).parent / ".env"
# load_dotenv(dotenv_path=env_path)

# SERPER_API_KEY = os.getenv("SERPER_API_KEY")
# HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# # Logging setup
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# if not SERPER_API_KEY:
#     logger.error("SERPER_API_KEY missing in .env")
#     raise ValueError("SERPER_API_KEY missing in .env")

# if HUGGINGFACE_API_KEY:
#     masked_key = HUGGINGFACE_API_KEY[:4] + "..." + HUGGINGFACE_API_KEY[-4:]
#     logger.info(f"Hugging Face API Key loaded: {masked_key}")
# else:
#     logger.warning("Hugging Face API Key NOT found.")

# # -------------------- FASTAPI --------------------
# app = FastAPI(title="Dromane Research API")

# class ResearchRequest(BaseModel):
#     query: str

# # -------------------- MODELS --------------------
# # Fallback chain: Primary -> Backup 1 -> Backup 2
# FALLBACK_MODELS = [
#     "google/gemma-2-2b-it",       # Reliable, instructional
#     "tiiuae/falcon-7b-instruct",  # Good alternative
#     "google/flan-t5-xxl"          # Old reliable, non-gated
# ]

# async def call_huggingface_model(client: httpx.AsyncClient, model: str, prompt: str) -> Optional[str]:
#     """Attempts to get a response from a specific Hugging Face model."""
#     api_url = f"https://api-inference.huggingface.co/models/{model}"
#     headers = {
#         "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
#         "Content-Type": "application/json"
#     }

#     # Format prompt based on model family
#     final_inputs = prompt
#     if "gemma" in model:
#         # Gemma Chat Format
#         # <start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n
#         final_inputs = f"<start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n"
#     elif "falcon" in model:
#         # Falcon Instruct Format
#         final_inputs = f"User: {prompt}\nAssistant:"
    
#     payload = {
#         "inputs": final_inputs,
#         "parameters": {
#             "max_new_tokens": 800,
#             "return_full_text": False,
#             "temperature": 0.3
#         }
#     }

#     try:
#         logger.info(f"Attempting model: {model}")
#         response = await client.post(api_url, headers=headers, json=payload, timeout=60.0)
        
#         if response.status_code == 200:
#             result = response.json()
#             # Handle list vs dict response
#             if isinstance(result, list) and result:
#                 return result[0].get("generated_text", "")
#             elif isinstance(result, dict):
#                 return result.get("generated_text", "")
#             return None
        
#         elif response.status_code == 503:
#             logger.warning(f"Model {model} is loading (503).")
#             return "WARMUP"  # Special signal for warmup
            
#         else:
#             logger.error(f"Model {model} failed with status {response.status_code}: {response.text}")
#             return None

#     except Exception as e:
#         logger.error(f"Exception calling {model}: {e}")
#         return None

# # -------------------- ENDPOINT --------------------
# @app.post("/api/research")
# async def perform_research(request: ResearchRequest):
#     query = request.query.strip()
#     logger.info(f"Researching: {query}")

#     # -------- 1. GOOGLE SEARCH (SERPER) --------
#     search_url = "https://google.serper.dev/search"
#     headers = {
#         "X-API-KEY": SERPER_API_KEY,
#         "Content-Type": "application/json"
#     }

#     try:
#         search_response = requests.post(
#             search_url,
#             headers=headers,
#             json={"q": query, "num": 8},
#             timeout=10
#         )
#         search_response.raise_for_status()
#         search_data = search_response.json()
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
#             detail=f"Search service unavailable: {str(e)}"
#         )

#     organic_results = search_data.get("organic", [])
#     if not organic_results:
#         raise HTTPException(status_code=404, detail="No search results found")

#     # -------- 2. SCRAPE SOURCES --------
#     sources = []
#     for idx, item in enumerate(organic_results, start=1):
#         url = item.get("link")
#         title = item.get("title", "Untitled")

#         if not url:
#             continue

#         text = ""
#         try:
#             # Try newspaper3k first
#             article = Article(url)
#             article.download()
#             article.parse()
#             text = article.text
#         except Exception:
#             # Fallback to requests+bs4
#             try:
#                 r = requests.get(url, timeout=6, headers={"User-Agent": "Mozilla/5.0"})
#                 soup = BeautifulSoup(r.text, "html.parser")
#                 for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
#                     tag.decompose()
#                 text = soup.get_text(separator=" ", strip=True)
#             except Exception:
#                 text = ""

#         if len(text) > 200:
#             sources.append({
#                 "id": idx,
#                 "title": title,
#                 "url": url,
#                 "snippet": text[:2000]
#             })

#     if not sources:
#         raise HTTPException(status_code=404, detail="No readable sources found")

#     # -------- 3. BUILD CONTEXT --------
#     context = ""
#     for s in sources:
#         context += f"\nSOURCE {s['id']} ({s['title']}):\n{s['snippet']}\n"

#     # Construct the instruction for the AI
#     final_prompt = (
#         f"You are a research assistant. Answer the user's question based ONLY on the sources below.\n"
#         f"Cite sources using [1], [2], etc.\n\n"
#         f"Question: {query}\n\n"
#         f"Sources:\n{context}\n\n"
#         f"Answer:"
#     )

#     # -------- 4. HUGGING FACE CALL (WITH FALLBACK) --------
#     ai_answer = "Could not generate answer from AI services."
    
#     if HUGGINGFACE_API_KEY:
#         async with httpx.AsyncClient() as client:
#             for model in FALLBACK_MODELS:
#                 response_text = await call_huggingface_model(client, model, final_prompt)
                
#                 if response_text == "WARMUP":
#                     ai_answer = f"I analyzed {len(sources)} sources, but the AI model ({model}) is currently warming up. Please try again in 20 seconds."
#                     break # Don't try other models if one is just warming up, or arguably checking others is better? 
#                     # Usually better to fail fast on warmup or try another. Let's try another.
#                     # Actually, if the first one is warming up, trying the second might be faster.
#                     # Let's count warmup as a failure to deliver *immediate* result, but maybe fallback is ready.
#                     # Implementation detail: Let's continue if warmup.
#                     continue
                
#                 if response_text:
#                     ai_answer = response_text
#                     logger.info(f"Success with model: {model}")
#                     break
#     else:
#         ai_answer = f"I analyzed {len(sources)} sources. (Hugging Face API key not configured)"

#     # -------- 5. RESPONSE --------
#     return {
#         "answer": ai_answer,
#         "sources": [
#             {"id": s["id"], "title": s["title"], "url": s["url"]}
#             for s in sources
#         ],
#         "source_count": len(sources)
#     }

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)



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

# ---------------- ENV ----------------
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

SERPER_API_KEY = os.getenv("SERPER_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not SERPER_API_KEY:
    raise RuntimeError("SERPER_API_KEY missing in .env")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY missing in .env")

groq_client = Groq(api_key=GROQ_API_KEY)

# ---------------- APP ----------------
app = FastAPI(title="Dromane Research API")

class ResearchRequest(BaseModel):
    query: str

# ---------------- ROUTE ----------------
@app.post("/api/research")
async def perform_research(req: ResearchRequest):
    query = req.query

    # 1️⃣ Google Search (Serper)
    search_res = requests.post(
        "https://google.serper.dev/search",
        headers={
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json"
        },
        json={"q": query, "num": 8},
        timeout=10
    )

    if search_res.status_code != 200:
        raise HTTPException(503, "Search service unavailable")

    results = search_res.json().get("organic", [])

    sources = []
    for i, r in enumerate(results, 1):
        url = r.get("link")
        title = r.get("title")
        if not url:
            continue

        text = ""
        try:
            article = Article(url)
            article.download()
            article.parse()
            text = article.text
        except:
            try:
                page = requests.get(url, timeout=5)
                soup = BeautifulSoup(page.text, "html.parser")
                for tag in soup(["script", "style", "nav", "footer"]):
                    tag.decompose()
                text = soup.get_text(" ", strip=True)
            except:
                pass

        if len(text) > 300:
            sources.append({
                "id": i,
                "title": title,
                "url": url,
                "content": text[:1800]
            })

    if not sources:
        raise HTTPException(404, "No readable sources found")

    # 2️⃣ Build Context
    context = ""
    for s in sources:
        context += f"[{s['id']}] {s['title']}\n{s['content']}\n\n"

    # 3️⃣ Ask Groq (LLaMA-3.1-8B-Instruct)
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a research assistant for students. Use ONLY the provided sources."
                },
                {
                    "role": "user",
                    "content": f"Question: {query}\n\nSources:\n{context}"
                }
            ],
            temperature=0.3,
            max_tokens=800
        )

        answer = completion.choices[0].message.content

    except Exception as e:
        print(f"Groq API Error: {e}")
        answer = f"I analyzed {len(sources)} sources, but the AI service failed. Review the sources below."

    # 4️⃣ Response
    return {
        "answer": answer,
        "sources": [
            {"id": s["id"], "title": s["title"], "url": s["url"]}
            for s in sources
        ],
        "source_count": len(sources)
    }
