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

# Modular imports
from config import OPENAI_API_KEY, GROQ_API_KEY, JWT_SECRET, SERPER_API_KEY, OLLAMA_URL
from auth import verify_jwt, authenticate_user, create_access_token, register_user, UserLogin, UserRegister, Token, pwd_context
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
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Routes
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

# Mount the research sub-application
# This ensures /api/research works on the main server (port 8000)
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

# Initialize SentenceTransformer for local embeddings
from sentence_transformers import SentenceTransformer
import numpy as np

embed_model = None
try:
    print("Loading embedding model (all-MiniLM-L6-v2)...")
    # Load fully on CPU to avoid CUDA/GPU weirdness on some machines
    embed_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
    print("Embedding model loaded successfully.")
except Exception as e:
    print(f"Warning: Failed to load embedding model: {e}")
    print("Running in Text-Only mode (PDF Context will be unavailable)")
    embed_model = None

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
        "embeddings_configured": embed_model is not None,
        "features": ["pdf_upload", "chat", "summarize", "code_explanation", "research"]
    }

@app.get("/health/ai")
def ai_health_check():
    """Quick check if Groq is configured"""
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq not configured")
    # Don't error if embeddings are missing, just report it
    return {
        "status": "ok", 
        "provider": "groq", 
        "model": "llama-3.1-8b-instant", 
        "embeddings": "local" if embed_model else "disabled"
    }

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    user: dict = Depends(verify_jwt)
):
    """Upload and process a PDF file using local embeddings"""
    if not embed_model:
        # Allow upload but warn that search won't work? 
        # Or better: Fail gracefully here if purely for RAG.
        # Let's allow upload for "Summarize" (which doesn't use embeddings) but warn for Chat.
        pass

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

        # Generate embeddings if model is available
        embeddings = []
        if embed_model:
            print(f"Generating embeddings for {len(chunks)} chunks...")
            embeddings = embed_model.encode(chunks)
        else:
            print("Skipping embeddings (Model not loaded)")
        
        # Store for user
        user_docs[user_id] = {
            "chunks": chunks,
            "embeddings": embeddings,
            "raw_text": text
        }

        msg = "PDF uploaded successfully"
        if not embed_model:
            msg += " (Search disabled: Embedding model missing)"

        return {
            "message": msg,
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
    """Chat with PDF using RAG (uses Groq for generation, Local for embeddings)"""
    # NO CHECK for embed_model here. Fallback allows General Chat.
        
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    user_id = str(user.get("id"))
    question = request.question
    
    if user_id not in chat_histories:
        chat_histories[user_id] = []

    context = ""
    sources = 0

    # Only try RAG if we have a doc AND an embedding model
    if user_id in user_docs and embed_model:
        doc_data = user_docs[user_id]
        chunks = doc_data["chunks"]
        doc_embeddings = doc_data["embeddings"] # Already numpy array
        
        print(f"RAG Request: user_id={user_id}, document={user_id in user_docs}, model={embed_model is not None}")
        
        if len(doc_embeddings) > 0:
            # Use local model for question embedding
            q_emb = embed_model.encode([question])[0]
            
            # Simple cosine similarity
            similarities = np.dot(doc_embeddings, q_emb) / (
                np.linalg.norm(doc_embeddings, axis=1) * np.linalg.norm(q_emb)
            )
            
            top_indices = np.argsort(similarities)[-3:][::-1]
            # Lower threshold to 0.1 to be more inclusive for broad questions
            relevant_chunks = [chunks[i] for i in top_indices if similarities[i] > 0.1]
            
            # Ensure at least the very TOP chunk is included if no chunk meets threshold
            if not relevant_chunks and len(chunks) > 0:
                relevant_chunks = [chunks[top_indices[0]]]
                print(f"No chunks > 0.1, using top chunk (score: {similarities[top_indices[0]]:.4f})")
            else:
                print(f"Found {len(relevant_chunks)} relevant chunks. Top score: {similarities[top_indices[0]]:.4f}")

            context = "\n\n".join(relevant_chunks)
            sources = len(relevant_chunks)
        else:
            print("No embeddings found for this user's document.")

    system_msg = "You are a highly capable AI research assistant for Dromane.ai."
    if context:
        system_msg += f"\n\nCRITICAL: Use the following information extracted from the user's uploaded PDF to answer the question. If the answer is in the context, use it. If not, inform the user you are using general knowledge.\n\nDOCUMENT CONTEXT:\n{context}"
    elif user_id in user_docs:
        if not embed_model:
            system_msg += "\n\nNote: A PDF is uploaded, but the similarity search model failed to load. Please acknowledge this and answer based on general knowledge if you can't see the document."
        else:
            system_msg += "\n\nNote: A PDF is uploaded, but no highly relevant sections were found for this specific query. Answer generally but keep the document presence in mind."
    
    messages = [{"role": "system", "content": system_msg}]
    messages.extend(chat_histories[user_id][-5:])
    messages.append({"role": "user", "content": question})

    try:
        # Use Groq (LLaMA) for generation
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7
        )
        answer = response.choices[0].message.content
        chat_histories[user_id].append({"role": "user", "content": question})
        chat_histories[user_id].append({"role": "assistant", "content": answer})
        
        return {"answer": answer, "sources": sources}
    except Exception as e:
        print(f"Chat API error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

class SummarizeRequest(BaseModel):
    text: Optional[str] = None

@app.post("/summarize")
async def summarize_doc(request: SummarizeRequest = None, user: dict = Depends(verify_jwt)):
    """Summarize using Groq (Supports both uploaded doc and direct text)"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    user_id = str(user.get("id"))
    text_to_summarize = ""

    if request and request.text:
        text_to_summarize = request.text
    elif user_id in user_docs:
        text_to_summarize = user_docs[user_id]["raw_text"][:10000] # Increased limit for stronger model
    else:
        raise HTTPException(status_code=400, detail="No text provided and no document uploaded")
    
    print("Calling Groq llama-3.1-8b-instant (Summarization)...")
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Summarize the following text accurately and concisely. Capture the main points and key details."},
                {"role": "user", "content": text_to_summarize}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        return {"summary": completion.choices[0].message.content}
    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Groq inference failed: {str(e)}")

@app.post("/explain-code")
async def explain_code(request: ChatRequest, user: dict = Depends(verify_jwt)):
    """Code explanation mode (Uses Groq LLaMA)"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a senior software engineer. Explain the following code block step-by-step, highlighting key logic and potential improvements."},
                {"role": "user", "content": request.question}
            ]
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code explanation failed: {str(e)}")

@app.post("/humanize")
async def humanize_text(request: ChatRequest, user: dict = Depends(verify_jwt)):
    """Humanize text mode (Uses Groq LLaMA)"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a professional editor. Rewrite the following text to make it sound more natural, human-like, and engaging, while getting rid of any robotic or AI-generated feel. Do not change the core meaning."},
                {"role": "user", "content": request.question}
            ]
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Humanize failed: {str(e)}")

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
    # Run on port 8001 to avoid conflict with PHP auth server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8001)
