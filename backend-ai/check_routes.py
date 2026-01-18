import requests
import json

BASE_URL = "http://localhost:8001"

def check_routes():
    print("Checking API Routes...")
    
    # 1. Health
    try:
        resp = requests.get(f"{BASE_URL}/")
        print(f"✅ GET /: {resp.status_code}")
    except Exception as e:
        print(f"❌ GET /: Failed ({e})")
        
    # 2. AI Health
    try:
        resp = requests.get(f"{BASE_URL}/health/ai")
        print(f"✅ GET /health/ai: {resp.status_code}")
    except Exception as e:
        print(f"❌ GET /health/ai: Failed ({e})")
        
    # 3. Auth Login (Method Not Allowed is expected for GET)
    try:
        resp = requests.get(f"{BASE_URL}/api/auth/login")
        if resp.status_code == 405:
            print(f"✅ POST /api/auth/login: Exists (405 Method Not Allowed on GET)")
        else:
            print(f"❓ POST /api/auth/login: {resp.status_code}")
    except:
        pass

    print("\nTo test Research/Chat, use the Frontend!")

if __name__ == "__main__":
    check_routes()
