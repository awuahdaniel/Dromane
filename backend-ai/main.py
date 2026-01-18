# main.py
# Production-ready Backend for Dromane.ai
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from pathlib import Path
from pypdf import PdfReader
from typing import List, Optional
from dotenv import load_dotenv
import mysql.connector

# Load environment variables
load_dotenv()

# Modular imports
from config import GROQ_API_KEY
from auth import verify_jwt, authenticate_user, create_access_token, register_user, UserLogin, UserRegister
from research import router as research_router
from groq import Groq
from database import get_db_connection

app = FastAPI(title="Dromane AI Backend (Prod)")

# ----------------------
# Groq client
# ----------------------
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Groq Init Error: {e}")

# ----------------------
# CORS
# ----------------------
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Database table check
# ----------------------
def ensure_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # MySQL syntax: AUTO_INCREMENT instead of SERIAL, LONGTEXT for content
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pdf_cache (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                content LONGTEXT, 
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_pdf_cache_user (user_id)
            );
        """)
        conn.commit()
    except Exception as e:
        print(f"DB Init Error: {e}")
    finally:
        cursor.close()
        conn.close()

# Ensure tables exist on startup
try:
    ensure_tables()
except:
    pass

# ----------------------
# Auth routes
# ----------------------
@app.post("/api/auth/login")
async def login(form_data: UserLogin):
    user = authenticate_user(form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token({
        "id": str(user["id"]),
        "name": user["name"],
        "email": user["email"]
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "success": True
    }

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    user = register_user(user_data)
    access_token = create_access_token({
        "id": str(user["id"]),
        "name": user["name"],
        "email": user["email"]
    })
    return {"user": user, "access_token": access_token, "token_type": "bearer"}

# ----------------------
# Include research router
# ----------------------
app.include_router(research_router)

# ----------------------
# Health check
# ----------------------
@app.get("/")
def read_root():
    return {"message": "Dromane AI Backend (Production)", "status": "Healthy"}

@app.get("/health/ai")
def ai_health_check():
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq not configured")
    return {"status": "ok", "provider": "groq", "model": "llama-3.1-8b-instant"}

# ----------------------
# PDF upload
# ----------------------
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), user: dict = Depends(verify_jwt)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    user_id = user.get("id")
    content = await file.read()
    
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    reader = PdfReader(tmp_path)
    text = "".join([page.extract_text() or "" for page in reader.pages])
    os.unlink(tmp_path)
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF is empty or unreadable")
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM pdf_cache WHERE user_id=%s", (user_id,))
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
    
    return {"message": "PDF uploaded", "filename": file.filename, "length": len(text)}

# ----------------------
# AI Feature Endpoints
# ----------------------
class QuestionRequest(BaseModel):
    question: str

class SummarizeRequest(BaseModel):
    text: Optional[str] = None

@app.post("/chat")
async def chat(request: QuestionRequest, user: dict = Depends(verify_jwt)):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq not configured")
    
    user_id = user.get("id")
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT content, filename FROM pdf_cache WHERE user_id=%s", (user_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    system_msg = "You are a highly capable AI research assistant for Dromane.ai."
    if row:
        pdf_text = row['content'][:12000]
        system_msg += f"\n\nCONTEXT FROM PDF ({row['filename']}):\n{pdf_text}\n\nAnswer based on the PDF."
    
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": request.question}
        ],
        temperature=0.7,
        max_tokens=800
    )
    return {"answer": response.choices[0].message.content, "sources": 1 if row else 0}

@app.post("/summarize")
async def summarize(request: SummarizeRequest = None, user: dict = Depends(verify_jwt)):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq not configured")

    user_id = user.get("id")
    text_to_summarize = ""

    if request and request.text:
        text_to_summarize = request.text
    else:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT content FROM pdf_cache WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if row:
            text_to_summarize = row['content'][:12000] 
        else:
            raise HTTPException(status_code=400, detail="No text provided and no document uploaded")
    
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

@app.post("/explain-code")
async def explain_code(request: QuestionRequest, user: dict = Depends(verify_jwt)):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq not configured")
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a senior software engineer. Explain the following code block step-by-step."},
            {"role": "user", "content": request.question}
        ]
    )
    return {"answer": response.choices[0].message.content}

@app.post("/humanize")
async def humanize(request: QuestionRequest, user: dict = Depends(verify_jwt)):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq not configured")
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "Rewrite the following text to sound more natural and human-like."},
            {"role": "user", "content": request.question}
        ]
    )
    return {"answer": response.choices[0].message.content}

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

# ----------------------
# Run app
# ----------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
