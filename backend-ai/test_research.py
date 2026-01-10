import requests
import time
import sys

URL = "http://localhost:8001/api/research"

def test_research():
    print(f"Testing Research Endpoint at {URL}...")
    
    payload = {
        "query": "What are the latest advancements in solid state batteries as of 2024?"
    }
    
    try:
        start_time = time.time()
        response = requests.post(URL, json=payload, timeout=120)
        end_time = time.time()
        
        print(f"Status Code: {response.status_code}")
        print(f"Time Taken: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            answer = data.get("answer", "")
            sources = data.get("sources", [])
            
            print("\n--- AI Answer ---")
            print(answer[:500] + "..." if len(answer) > 500 else answer)
            print(f"\nSources Found: {len(sources)}")
            
            if "I analyzed" in answer and "failed" in answer:
                print("\n[FAILURE] AI returned a failure message inside 200 OK.")
                sys.exit(1)
            
            if not answer:
                print("\n[FAILURE] Empty answer received.")
                sys.exit(1)
                
            print("\n[SUCCESS] Research endpoint is working correctly!")
            
        else:
            print(f"\n[FAILURE] HTTP Error: {response.text}")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n[EXCEPTION] {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_research()
