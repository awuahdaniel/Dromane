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

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()

# Models
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

# Helpers
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=1440) # 24 hours default
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
        
        if not user:
            return False
            
        # Verify password (PHP uses BCrypt, passlib handles this automatically)
        if not verify_password(password, user['password_hash']):
            return False
            
        return user
    except Exception as e:
        print(f"Auth Error: {e}")
        return False
    finally:
        if conn and conn.is_connected():
            if 'cursor' in locals(): cursor.close()
            conn.close()

def register_user(user_data: UserRegister):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
            
        hashed_pw = get_password_hash(user_data.password)
        
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
            (user_data.name, user_data.email, hashed_pw)
        )
        conn.commit()
        
        new_id = cursor.lastrowid
        return {
            "id": new_id,
            "name": user_data.name,
            "email": user_data.email
        }
    except mysql.connector.Error as err:
        print(f"DB Error: {err}")
        raise HTTPException(status_code=500, detail="Database error during registration")
    finally:
        if conn and conn.is_connected():
            if 'cursor' in locals(): cursor.close()
            conn.close()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Decode the token with lenient options for PHP compatibility
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={
                "verify_aud": False, 
                "verify_iss": False,
                "verify_sub": False  # Don't strictly validate subject type
            }
        )
        
        # Handle both Python-created tokens (with 'data') and PHP-created tokens (with 'sub')
        user_data = payload.get("data")
        
        if not user_data:
            # PHP token format: has 'sub' and 'email' at root level
            sub = payload.get("sub")
            email = payload.get("email")
            
            if sub:
                # Convert sub to string if it's an integer (from old PHP tokens)
                user_id = str(sub) if isinstance(sub, int) else sub
                user_data = {
                    "id": user_id,
                    "email": email if email else "unknown@example.com"
                }
        
        # Validate we have user identification
        if not user_data or not user_data.get("id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing user identification"
            )
            
        return user_data
        
    except JWTError as e:
        error_msg = str(e)
        print(f"JWT Error: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Invalid or expired token: {error_msg}"
        )
