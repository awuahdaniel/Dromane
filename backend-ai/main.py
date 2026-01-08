from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt
import os
from dotenv import load_dotenv
from pathlib import Path
import shutil
from pypdf import PdfReader
import numpy as np
from openai import OpenAI
import requests

load_dotenv(dotenv_path="../.env")

app = FastAPI()

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

security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY") or "hf_dummy_key"
PHP_AUTH_URL = "http://localhost:8000"

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set in .env")

# Initialize OpenAI client
client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory storage for user documents and embeddings
user_docs = {}
chat_histories = {}

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], audience="dromane.ai")
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/")
def read_root():
    return {
        "message": "Dromane AI Backend (Final Version)",
        "status": "Healthy",
        "features": {
            "pdf_upload": True,
            "chat": True,
            "summarize": True,
            "code_explanation": True
        }
    }

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    token_payload: dict = Depends(verify_token)
):
    """Upload and process a PDF file using pure OpenAI/PyPDF"""
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    user_id = str(token_payload.get("data", {}).get("id"))
    
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
        
        # Simple chunking
        chunk_size = 1000
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
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

        # Persist to PHP backend
        try:
            raw_token = jwt.encode(token_payload, JWT_SECRET, algorithm='HS256')
            requests.post(f"{PHP_AUTH_URL}/documents.php", json={
                "filename": file.filename,
                "file_path": str(file_path)
            }, headers={"Authorization": f"Bearer {raw_token}"}, timeout=2)
        except Exception as e:
            print(f"Warning: Failed to persist metadata to PHP: {e}")
        
        return {
            "message": "PDF uploaded and processed successfully",
            "filename": file.filename,
            "chunks": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
async def chat(
    request: ChatRequest,
    token_payload: dict = Depends(verify_token)
):
    """Chat with PDF using RAG or general fallback"""
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    user_id = str(token_payload.get("data", {}).get("id"))
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
async def summarize_doc(token_payload: dict = Depends(verify_token)):
    """Summarize using HF or OpenAI"""
    user_id = str(token_payload.get("data", {}).get("id"))
    if user_id not in user_docs:
        raise HTTPException(status_code=404, detail="No document uploaded")
    
    text = user_docs[user_id]["raw_text"][:4000]
    
    hf_url = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    
    try:
        response = requests.post(hf_url, headers=headers, json={"inputs": text}, timeout=10)
        result = response.json()
        if isinstance(result, list) and "summary_text" in result[0]:
            return {"summary": result[0]["summary_text"]}
    except:
        pass

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "Summarize accurately"}, {"role": "user", "content": text}]
    )
    return {"summary": resp.choices[0].message.content}

@app.post("/explain-code")
async def explain_code(request: ChatRequest, token_payload: dict = Depends(verify_token)):
    """Code explanation mode"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a code expert. Explain step-by-step."},
            {"role": "user", "content": request.question}
        ]
    )
    return {"answer": response.choices[0].message.content}

@app.delete("/clear")
async def clear_documents(token_payload: dict = Depends(verify_token)):
    user_id = str(token_payload.get("data", {}).get("id"))
    if user_id in user_docs: del user_docs[user_id]
    if user_id in chat_histories: del chat_histories[user_id]
    return {"message": "Cleared"}
