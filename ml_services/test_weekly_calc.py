from fastapi.testclient import TestClient
from app import app
import json

client = TestClient(app)

def run_tests():
    print("Testing /health endpoint...")
    response = client.get("/health")
    print(f"Status: {response.status_code}")
    print(f"Body: {response.json()}")

    print("\nTesting /calculate-weekly-price endpoint...")
    payload = {
        "city_id": 101,
        "city": "Hyderabad",
        "base_price": 500,
        "weather": {
            "rainfall_mm": 120,
            "temperature": 30,
            "extreme_alert": True,
            "condition": "heavy rain"
        },
        "news_summary": "Flood warnings and transport strike expected next week",
        "outages": {
            "count": 3,
            "avg_duration": 2
        }
    }
    
    response = client.post("/calculate-weekly-price", json=payload)
    print(f"Status: {response.status_code}")
    try:
        print(f"Body: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Raw body: {response.text}")

if __name__ == "__main__":
    run_tests()
