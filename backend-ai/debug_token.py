import jwt
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")
secret = os.getenv("JWT_SECRET")

print(f"Secret: '{secret}'")
print(f"Secret Type: {type(secret)}")

with open("last_token.txt", "r") as f:
    token = f.read().strip()

print(f"Token: '{token}'")

try:
    payload = jwt.decode(token, secret, algorithms=["HS256"], audience="dromane.ai")
    print("SUCCESS: Token decoded!")
    print(payload)
except Exception as e:
    print(f"FAILED: {e}")
