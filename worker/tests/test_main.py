import pytest
from fastapi.testclient import TestClient
from app.main import app
import os

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "worker-engine"}

def test_analyze_dns_invalid_url():
    response = client.post("/analyze/dns", json={"url": "not-a-url", "scanId": "123"})
    assert response.status_code == 422 # Pydantic validation error expected

def test_analyze_dns_valid_url(mocker):
    # Mock the actual dns resolution so we don't depend on network in unit tests
    mock_data = {
        "hostname": "example.com",
        "records": {"A": ["93.184.216.34"]},
        "provider": "Unknown",
        "responseTime": 10,
        "error": None
    }
    mocker.patch('app.main.analyze_dns', return_value=mock_data)
    
    response = client.post("/analyze/dns", json={"url": "https://example.com", "scanId": "123"})
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["hostname"] == "example.com"

def test_analyze_inference():
    response = client.post("/analyze/inference", json={
        "http": {
            "data": {
                "technologies": {"framework": "React"}
            }
        }
    })
    
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["architecture"]["frontend"]["framework"] == "React"
