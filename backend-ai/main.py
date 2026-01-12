from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
from pypdf import PdfReader
import numpy as np
from openai import OpenAI
import requests
import json
from bs4 import BeautifulSoup
from newspaper import Article
from typing import List, Optional

from dotenv import load_dotenv
from pathlib import Path
from research import app as research_app, perform_research as research_logic, ResearchRequest
# New modular imports
from config import OPENAI_API_KEY, GROQ_API_KEY, JWT_SECRET, SERPER_API_KEY, OLLAMA_URL
from auth import verify_jwt
# Import research components at top level
from research import app as research_app, perform_research as research_logic, ResearchRequest
from groq import Groq

app = FastAPI(title="Dromane AI Backend")

# Initialize Groq client
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Groq Client Init Error: {e}")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the research sub-application
# This ensures /api/research works on the main server (port 5000)
app.mount("/sub", research_app)

@app.post("/api/research")
async def integrated_research(request: ResearchRequest, user: dict = Depends(verify_jwt)):
    """Integrated research endpoint that uses main app authentication"""
    return await research_logic(request)

PHP_AUTH_URL = "http://localhost:8000"

# Initialize OpenAI client
client = None
if OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        print(f"OpenAI Client Init Error: {e}")

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory storage for user documents and embeddings
user_docs = {}
chat_histories = {}

@app.get("/")
def read_root():
    return {
        "message": "Dromane AI Backend (Secured)",
        "status": "Healthy",
        "openai_configured": client is not None,
        "features": ["pdf_upload", "chat", "summarize", "code_explanation", "research"]
    }

@app.get("/health/ai")
def ai_health_check():
    """Quick check if Groq is configured"""
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq not configured")
    return {"status": "ok", "provider": "groq", "model": "llama-3.1-8b-instant"}

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    user: dict = Depends(verify_jwt)
):
    """Upload and process a PDF file using pure OpenAI/PyPDF"""
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    user_id = str(user.get("id"))
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    file_path = UPLOAD_DIR / f"{user_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract text from PDF
    try:
        reader = PdfReader(str(file_path))
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        
        if not text.strip():
             raise ValueError("PDF seems to be empty or unreadable")

        # Simple chunking
        chunk_size = 1000
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size) if text[i:i+chunk_size].strip()]
        
        if not chunks:
            raise ValueError("No text content found to process")

        # Generate embeddings for chunks
        response = client.embeddings.create(
            input=chunks,
            model="text-embedding-3-small"
        )
        
        embeddings = [data.embedding for data in response.data]
        
        # Store for user
        user_docs[user_id] = {
            "chunks": chunks,
            "embeddings": embeddings,
            "raw_text": text
        }

        return {
            "message": "PDF uploaded and processed successfully",
            "filename": file.filename,
            "chunks": len(chunks)
        }
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
async def chat(
    request: ChatRequest,
    user: dict = Depends(verify_jwt)
):
    """Chat with PDF using RAG or general fallback"""
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    user_id = str(user.get("id"))
    question = request.question
    
    if user_id not in chat_histories:
        chat_histories[user_id] = []

    context = ""
    sources = 0

    if user_id in user_docs:
        doc_data = user_docs[user_id]
        chunks = doc_data["chunks"]
        doc_embeddings = np.array(doc_data["embeddings"])
        
        q_resp = client.embeddings.create(input=[question], model="text-embedding-3-small")
        q_emb = np.array(q_resp.data[0].embedding)
        
        # Simple cosine similarity
        similarities = np.dot(doc_embeddings, q_emb) / (
            np.linalg.norm(doc_embeddings, axis=1) * np.linalg.norm(q_emb)
        )
        
        top_indices = np.argsort(similarities)[-3:][::-1]
        relevant_chunks = [chunks[i] for i in top_indices if similarities[i] > 0.3]
        
        context = "\n\n".join(relevant_chunks)
        sources = len(relevant_chunks)

    system_msg = "You are a helpful assistant for Dromane.ai."
    if context:
        system_msg += f"\nUse the following context from the user's uploaded PDF to answer the question:\n{context}"
    
    messages = [{"role": "system", "content": system_msg}]
    messages.extend(chat_histories[user_id][-5:])
    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7
        )
        answer = response.choices[0].message.content
        chat_histories[user_id].append({"role": "user", "content": question})
        chat_histories[user_id].append({"role": "assistant", "content": answer})
        
        return {"answer": answer, "sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/summarize")
async def summarize_doc(user: dict = Depends(verify_jwt)):
    """Summarize using Groq"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    user_id = str(user.get("id"))
    if user_id not in user_docs:
        raise HTTPException(status_code=404, detail="No document uploaded")
    
    text = user_docs[user_id]["raw_text"][:4000]
    
    print("Calling Groq llama-3.1-8b-instant (Summarization)...")
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Summarize the following document accurately and concisely."},
                {"role": "user", "content": text}
            ],
            temperature=0.3,
            max_tokens=500
        )
        return {"summary": completion.choices[0].message.content}
    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Groq inference failed: {str(e)}")

@app.post("/explain-code")
async def explain_code(request: ChatRequest, user: dict = Depends(verify_jwt)):
    """Code explanation mode"""
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a senior software engineer. Explain the following code block step-by-step, highlighting key logic and potential improvements."},
            {"role": "user", "content": request.question}
        ]
    )
    return {"answer": response.choices[0].message.content}

@app.delete("/clear")
async def clear_documents(user: dict = Depends(verify_jwt)):
    user_id = str(user.get("id"))
    count = 0
    if user_id in user_docs: 
        del user_docs[user_id]
        count += 1
    if user_id in chat_histories: 
        del chat_histories[user_id]
        count += 1
    return {"message": "State cleared", "items_removed": count}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
