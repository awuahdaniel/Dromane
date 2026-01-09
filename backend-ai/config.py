from dotenv import load_dotenv
import os
from pathlib import Path

# Load project root .env first, then local .env as override
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")

# Validate critical settings
if not JWT_SECRET:
    print("WARNING: JWT_SECRET not found in environment!")
if not SERPER_API_KEY:
    print("WARNING: SERPER_API_KEY not found in environment!")
if not OPENAI_API_KEY:
    print("WARNING: OPENAI_API_KEY not found in environment!")
