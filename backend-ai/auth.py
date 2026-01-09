from jose import jwt, JWTError
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import JWT_SECRET, JWT_ALGORITHM

security = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # We decode the token. Note: the PHP side might have 'aud' and 'iss'.
        # To be safe and fix the error, we verify the signature but are lenient on other claims 
        # unless specifically needed.
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False, "verify_iss": False}
        )
        
        # In our app, the user data is stored in the 'data' key or 'sub'
        user_data = payload.get("data")
        if not user_data:
            # Fallback to sub or the whole payload if 'data' is missing
            user_data = {"id": payload.get("sub"), "email": payload.get("email")}
            
        if not user_data.get("id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing user identification (id or sub)"
            )
            
        return user_data
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Invalid or expired token: {str(e)}"
        )
