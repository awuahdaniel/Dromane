# Product Requirements Document (PRD) - Dromane.ai

## 1. Introduction
**Product Name:** Dromane.ai
**Goal:** A "Research & Code Hub" for students to chat with PDFs and explain code snippets.
**Target Audience:** Students and Researchers.

## 2. Core Features (MVP)

### 2.1 User Authentication (Hybrid System)
*   **Role:** Secure user identity management.
*   **Technology:** PHP 8.x + MySQL.
*   **Features:**
    *   User Registration (Email, Password).
    *   User Login.
    *   JWT Token Generation (issued by PHP).
    *   Password Hashing (bcrypt).
*   **Constraints:** MUST use PHP for Auth (Professor's Requirement).

### 2.2 Intelligence Layer (RAG Pipeline)
*   **Role:** Handle document processing and AI reasoning.
*   **Technology:** FastAPI (Python 3.10+) + LangChain + ChromaDB.
*   **Features:**
    *   **Document Upload:** Users can upload PDFs.
    *   **Text Extraction:** Extract text from PDFs (PyPDF).
    *   **Vector Storage:** Store embeddings in ChromaDB (Local).
    *   **Chat Interface:** RAG-based Q&A using OpenAI `gpt-4o-mini`.
    *   **JWT Verification:** Validate PHP-issued tokens before processing requests.

### 2.3 Frontend Interface
*   **Role:** User interaction and state management.
*   **Technology:** React + Vite + Tailwind CSS.
*   **Features:**
    *   Login/Register Pages.
    *   Chat Dashboard.
    *   Document Upload UI.
    *   Secure communication with both backends (Port 8000 for PHP, Port 5000 for Python).

## 3. System Architecture
*   **Frontend:** React (Vite)
*   **Auth Backend:** PHP (Port 8000)
*   **AI Backend:** Python FastAPI (Port 5000)
*   **Database:** MySQL (Users, Document Metadata)

## 4. Non-Functional Requirements
*   **Performance:** Async file processing in FastAPI to prevent blocking.
*   **Security:** JWT for stateless auth, CORS enabled for dev environment.
*   **Deployment:** Hybrid deployment capability (Vercel/Railways/Render).