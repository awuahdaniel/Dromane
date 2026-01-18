# auth.py
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import mysql.connector
from config import JWT_SECRET, JWT_ALGORITHM
from database import get_db_connection

# ----------------------
# Password hashing
# ----------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ----------------------
# Models
# ----------------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# ----------------------
# Helpers
# ----------------------
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(user: dict, expires_delta: Optional[timedelta] = None):
    """
    Generate a JWT token with the user info wrapped under 'data'.
    This guarantees compatibility with verify_jwt.
    """
    to_encode = {"data": user}  # wrap user info under 'data'
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=1440))  # default 24h
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def authenticate_user(email: str, password: str):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user or not verify_password(password, user['password_hash']):
            return False
        return user
    except Exception as e:
        print(f"Auth Error: {e}")
        return False
    finally:
        if conn:
            cursor.close()
            conn.close()

def register_user(user_data: UserRegister):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_pw = get_password_hash(user_data.password)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
            (user_data.name, user_data.email, hashed_pw)
        )
        new_id = cursor.lastrowid
        conn.commit()
        
        return {"id": new_id, "name": user_data.name, "email": user_data.email}
    except mysql.connector.Error as err:
        print(f"DB Error: {err}")
        raise HTTPException(status_code=500, detail=f"Database error during registration: {str(err)}")
    finally:
        if conn:
            cursor.close()
            conn.close()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        print("DEBUG: Verifying JWT token...")
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False, "verify_iss": False, "verify_sub": False, "leeway": 60}
        )
        
        # Try Python-style token (wrapped in 'data')
        user_data = payload.get("data")
        
        # Fallback to PHP-style token (direct root fields)
        if not user_data:
            sub = payload.get("sub")
            email = payload.get("email")
            if sub:
                user_data = {"id": str(sub), "email": email or "unknown@example.com"}
        
        if not user_data or not user_data.get("id"):
            print("DEBUG: Token payload missing 'id' or 'data'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing user identification"
            )
        
        print(f"DEBUG: Token verified for user {user_data.get('id')}")
        return user_data
        
    except JWTError as e:
        print(f"DEBUG: JWT Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}"
        )
