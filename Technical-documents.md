# Technical Design Document: Dromane.ai

## 🏗️ System Architecture
Dromane.ai uses a **Hybrid Microservices** approach to balance academic requirements with AI performance.



### 1. Identity Layer (PHP 8.x + MySQL)
- **Role:** Handles User Management.
- **Auth Flow:** - Receives credentials -> Validates via MySQL -> Issues a **JWT (JSON Web Token)**.
  - **Secret Key:** Shared with the AI Backend to ensure trust.

### 2. Intelligence Layer (FastAPI + Python 3.10+)
- **Role:** Handles AI Orchestration & Document Processing.
- **RAG Pipeline:**
  - **Loader:** PyPDF for text extraction.
  - **Splitter:** Recursive character splitting.
  - **Vector Store:** ChromaDB (Local storage).
  - **LLM:** OpenAI `gpt-4o-mini` for cost-effective reasoning.

### 3. Frontend Layer (React + Vite)
- **State Management:** LocalStorage for JWT persistence.
- **Communication:**
  - `POST /login` -> PHP Backend (Port 8000)
  - `POST /chat` -> FastAPI Backend (Port 5000)

## 📊 Database Schema (MySQL)
- **users:** `id`, `email`, `password_hash`, `created_at`
- **documents:** `id`, `user_id`, `filename`, `file_path`, `upload_date`

## 🛡️ Security & Performance
- **CORS:** Explicitly enabled for the React dev server port.
- **Passwords:** Hashed using `PASSWORD_BCRYPT`.
- **Async Tasks:** FastAPI handles file processing asynchronously to prevent UI freezing.

## 🌐 Deployment Plan
- **Frontend:** Vercel
- **PHP Backend:** Shared Hosting or Railway.app
- **AI Backend:** Render.com (Web Service)
- **Database:** Supabase MySQL or PlanetScale