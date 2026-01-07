🎯 Project Overview
App: Dromane.ai Goal: A "Research & Code Hub" for students to chat with PDFs and explain code snippets. Stack: React (Frontend) + PHP (Auth/MySQL) + FastAPI (AI/RAG Brain) Current Phase: Phase 1 - Foundation & Hybrid Auth

🧠 How I Should Think
Hybrid Awareness: Always remember there are three distinct environments: frontend/ (React), backend-auth/ (PHP), and backend-ai/ (FastAPI).

Context First: Before suggesting code, check if the task belongs to Identity (PHP) or Intelligence (Python).

Professor's Constraint: Do NOT suggest Node.js/Supabase for Auth. Identity must remain in PHP/MySQL as per project requirements.

JWT Handshake: Understand that PHP issues the token, and FastAPI validates it.

📁 Context Files
agent_docs/tech_stack.md: Details on LangChain, ChromaDB, and Tailwind.

agent_docs/code_patterns.md: PHP PDO patterns and React functional components.

agent_docs/product_requirements.md: Full MVP feature list.

🔄 Current State
Last Updated: January 7, 2026 Working On: Setting up the login.php and jwt_helper.php logic. Recently Completed: MySQL table schema for users and documents. Blocked By: None.

🚀 Roadmap
Phase 1: Foundation (Current)
[x] Initialize directory structure

[x] Setup MySQL Schema

[ ] Implement PHP Registration/Login

[ ] Setup FastAPI "Hello World" with JWT Middleware

Phase 2: Core Intelligence
[ ] Implement PDF Upload & Text Extraction (FastAPI)

[ ] Integrate Vector Store (ChromaDB)

[ ] Build React Chat Dashboard

⚠️ What NOT To Do
Never remove the header("Access-Control-Allow-Origin: *") from PHP files; it breaks the Hybrid connection.

Never use mysql_query (obsolete); always use PDO for PHP database interactions.

Do NOT install heavy Python libraries (like Torch) unless specifically needed for local models; prefer API-based solutions (OpenAI) for the MVP.

Do NOT modify .env files without alerting the user to update their local keys.

# ANTIGRAVITY.md - Antigravity Configuration for [App Name]

## 🎯 Project Context
**App:** [App Name]
**Stack:** [Tech Stack]
**Stage:** MVP Development
**User Level:** [Level]

## 📋 Directives
1. **Master Plan:** Always read `AGENTS.md` first. It contains the current phase and tasks.
2. **Documentation:** Refer to `agent_docs/` for tech stack details, code patterns, and testing guides.
3. **Incremental Build:** Build one small feature at a time. Test frequently.
4. **No Linting:** Do not act as a linter. Use `npm run lint` if needed.
5. **Communication:** Be concise. Explain your plan before implementing.

## 🛠 Commands
- `npm run dev` - Start server
- `npm test` - Run tests
- `npm run lint` - Check code style


# AGENTS.md - Master Plan for Dromane.ai

## 🎯 Project Overview
**Goal:** Research tool for students to chat with PDFs and explain code.
**Hybrid Stack:** - Frontend: React (Vite)
- Auth Backend: PHP 8.x + MySQL (Required by Professor)
- AI Backend: FastAPI + LangChain + ChromaDB

## 🧠 Core Directives
1. **Never Bypass PHP for Auth**: All user registration and login MUST happen in `backend-auth/` using PHP.
2. **JWT Bridge**: PHP issues a JWT; FastAPI must verify this JWT before processing AI requests.
3. **Contextual Routing**: 
   - `frontend/src/lib/auth.js` -> talks to PHP (Port 8000)
   - `frontend/src/lib/ai.js` -> talks to Python (Port 5000)

## 🔄 Current Sprint State
**Last Updated:** Jan 7, 2026
**Working On:** Phase 1 - Setting up the JWT handshake between PHP and Python.

