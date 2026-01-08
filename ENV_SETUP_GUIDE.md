# 🔧 Dromane.ai - Complete Environment Setup Guide

This guide will walk you through configuring **every single API key and secret** needed to run Dromane.ai.

---

## 📁 Step 1: Locate Your .env File

Your `.env` file should be at:
```
c:\Users\HP ELITE BOOK 840G3\Desktop\Dromane\dromane-ai\.env
```

Open this file in your code editor (VS Code, Notepad++, etc.)

---

## 🗄️ Step 2: Database Configuration (MySQL)

These connect to your local MySQL database.

```env
DB_HOST=localhost
DB_NAME=dromane_db
DB_USER=root
DB_PASS=
```

### How to verify:
1. Open XAMPP Control Panel
2. Start MySQL
3. Open phpMyAdmin (http://localhost/phpmyadmin)
4. Create database `dromane_db` if it doesn't exist:
   ```sql
   CREATE DATABASE dromane_db;
   ```

---

## 🔐 Step 3: JWT_SECRET (CRITICAL)

This is used to sign authentication tokens. **Both PHP and FastAPI must use the EXACT same value.**

```env
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_64_chars
```

### How to generate a secure secret:
**Option A: Online Generator**
- Go to: https://randomkeygen.com/
- Copy a "Fort Knox Password" (64 characters)

**Option B: PowerShell Command**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### ⚠️ IMPORTANT RULES:
- NO spaces before or after the `=` sign
- NO quotes around the value
- Make it at least 32 characters long

---

## 🤖 Step 4: OpenAI API Key

This powers the AI chat, embeddings, and code explanation features.

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
```

### How to get your OpenAI API key:

1. **Go to:** https://platform.openai.com/
2. **Sign in** or create an account
3. Click your profile icon (top right) → **"View API keys"**
4. Click **"Create new secret key"**
5. Give it a name like "Dromane-AI"
6. **COPY THE KEY IMMEDIATELY** (you can't see it again!)
7. Paste it in your `.env` file

### ⚠️ Important:
- OpenAI requires billing setup. Go to https://platform.openai.com/account/billing
- Add a payment method and add at least $5 credit
- Without credit, API calls will fail with `insufficient_quota` error

---

## 🤗 Step 5: Hugging Face API Key (Optional)

This powers the document summarization feature using BART model.

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx
```

### How to get your Hugging Face API key:

1. **Go to:** https://huggingface.co/
2. **Sign up** or log in
3. Click your profile icon → **"Settings"**
4. Click **"Access Tokens"** in the left sidebar
5. Click **"New token"**
6. Name: "Dromane-AI", Role: "Read"
7. Click **"Generate"**
8. Copy the token (starts with `hf_`)
9. Paste it in your `.env` file

### Note:
If you don't have this key, summarization will fall back to OpenAI (which still works).

---

## 🔵 Step 6: Google OAuth (Optional - for "Sign in with Google")

```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
```

### How to set up Google OAuth:

1. **Go to:** https://console.cloud.google.com/
2. Create a new project or select existing one
3. Navigate to: **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth client ID"**
5. If prompted, configure the **OAuth consent screen** first:
   - User Type: External
   - App name: Dromane.ai
   - User support email: Your email
   - Developer email: Your email
   - Click Save
6. Back to Credentials → Create OAuth client ID:
   - Application type: **Web application**
   - Name: Dromane.ai
   - Authorized redirect URIs: Add these:
     ```
     http://localhost:8000/oauth_google_callback.php
     http://localhost:5173/auth/callback
     ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**
9. Paste them in your `.env` file

---

## ⚫ Step 7: GitHub OAuth (Optional - for "Sign in with GitHub")

```env
GITHUB_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
```

### How to set up GitHub OAuth:

1. **Go to:** https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - Application name: `Dromane.ai`
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:8000/oauth_github_callback.php`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"**
7. Copy the **Client Secret** immediately
8. Paste both in your `.env` file

---

## 📝 Complete .env File Template

Copy this entire block and replace with your actual values:

```env
# Database (XAMPP MySQL)
DB_HOST=localhost
DB_NAME=dromane_db
DB_USER=root
DB_PASS=

# JWT Secret (MUST be identical in PHP and FastAPI)
JWT_SECRET=PASTE_YOUR_64_CHARACTER_SECRET_HERE

# OpenAI (REQUIRED for chat features)
OPENAI_API_KEY=sk-proj-PASTE_YOUR_KEY_HERE

# Hugging Face (OPTIONAL - for summarization)
HUGGINGFACE_API_KEY=hf_PASTE_YOUR_KEY_HERE

# Google OAuth (OPTIONAL - for Google Sign-In)
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_SECRET

# GitHub OAuth (OPTIONAL - for GitHub Sign-In)
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
```

---

## ✅ Step 8: Verify Your Setup

After saving your `.env` file, restart ALL servers:

### Terminal 1: PHP Backend
```powershell
cd "c:\Users\HP ELITE BOOK 840G3\Desktop\Dromane\dromane-ai\backend-auth"
C:\xampp\php\php.exe -S localhost:8000
```

### Terminal 2: FastAPI Backend
```powershell
cd "c:\Users\HP ELITE BOOK 840G3\Desktop\Dromane\dromane-ai\backend-ai"
python -m uvicorn main:app --reload --port 5000
```

### Terminal 3: Frontend
```powershell
cd "c:\Users\HP ELITE BOOK 840G3\Desktop\Dromane\dromane-ai\frontend"
npm run dev
```

---

## 🧪 Step 9: Test Each Feature

| Feature | Test Method | Expected Result |
|---------|-------------|-----------------|
| **Login** | Go to http://localhost:5173/login, enter credentials | Redirect to dashboard |
| **Chat** | Send a message in Research Assistant | AI responds |
| **PDF Upload** | Upload a PDF in PDF Chat | "Document processed" |
| **Summarize** | Click Summarize after upload | Summary appears |
| **Theme** | Go to Settings, click Light/Dark | UI colors change |
| **Google OAuth** | Click "Continue with Google" | Google consent screen |
| **GitHub OAuth** | Click "Continue with GitHub" | GitHub authorization |

---

## 🔴 Troubleshooting Common Errors

### "JWT Signature Verification Failed"
- Your JWT_SECRET is different between PHP and FastAPI
- Check for extra spaces or quotes in .env
- Restart BOTH backend servers after changing

### "OpenAI API Error" / "insufficient_quota"
- Add billing/credits to your OpenAI account
- Verify your API key is correct and not expired

### "Database Connection Failed"
- Make sure XAMPP MySQL is running
- Verify database `dromane_db` exists

### "Blank Page / App Won't Load"
- Check browser console for errors (F12 → Console)
- Make sure frontend server is running on port 5173

### "OAuth Not Working"
- Verify callback URLs match exactly
- Check that credentials are pasted correctly without extra spaces

---

## 📞 Quick Commands Reference

```powershell
# Kill all running servers
taskkill /F /IM php.exe
taskkill /F /IM uvicorn.exe
taskkill /F /IM node.exe

# Start fresh
# (Run each in separate terminal windows)
```

---

**Save this guide and follow each step carefully. The most common issue is the JWT_SECRET having a space or being different between services.**
