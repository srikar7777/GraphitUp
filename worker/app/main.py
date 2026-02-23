import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="graphitUp Worker Engine",
    description="Python worker for executing deep system infrastructure analysis.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared Models
class AnalyzeRequest(BaseModel):
    url: HttpUrl
    scanId: str

class AskRequest(BaseModel):
    question: str
    context: Dict[str, Any]  # Full scan results

class AskResponse(BaseModel):
    answer: str
    confidence: int
    citations: List[str]
    suggested_questions: List[str]

class PhaseResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "worker-engine"
    }

from .analyzers.dns_analyzer import analyze_dns
from .analyzers.tls_analyzer import analyze_tls
from .analyzers.http_analyzer import analyze_http
from .analyzers.crawler import analyze_crawl
from .analyzers.inference import analyze_inference

@app.post("/analyze/dns", response_model=PhaseResponse)
async def endpoint_analyze_dns(req: AnalyzeRequest):
    try:
        # DNS analysis is synchronous
        result_data = analyze_dns(str(req.url))
        if result_data.get("error"):
            return {"success": False, "error": result_data["error"]}
        return {"success": True, "data": result_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/analyze/tls", response_model=PhaseResponse)
async def endpoint_analyze_tls(req: AnalyzeRequest):
    try:
        result_data = analyze_tls(str(req.url))
        if result_data.get("error"):
            return {"success": False, "error": result_data["error"]}
        return {"success": True, "data": result_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/analyze/http", response_model=PhaseResponse)
async def endpoint_analyze_http(req: AnalyzeRequest):
    try:
        # HTTP analysis is async
        result_data = await analyze_http(str(req.url))
        if result_data.get("error"):
            return {"success": False, "error": result_data["error"]}
        return {"success": True, "data": result_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/analyze/crawl", response_model=PhaseResponse)
async def endpoint_analyze_crawl(req: AnalyzeRequest):
    try:
        headless = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true"
        timeout_ms = int(os.getenv("PLAYWRIGHT_TIMEOUT_MS", "30000"))
        
        # Crawl analysis is async
        result_data = await analyze_crawl(str(req.url), headless=headless, timeout_ms=timeout_ms)
        if result_data.get("error"):
            return {"success": False, "error": result_data["error"]}
        return {"success": True, "data": result_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/analyze/inference", response_model=PhaseResponse)
async def endpoint_analyze_inference(data_payload: Dict[str, Any]):
    # Inference takes raw data payload from the other scans, not just a URL
    try:
        result_data = analyze_inference(data_payload)
        return {"success": True, "data": result_data}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/ai/ask", response_model=AskResponse)
async def endpoint_ask_question(req: AskRequest):
    """Natural language Q&A grounded exclusively in the scan evidence."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return AskResponse(
            answer="AI Q&A is not configured. Add a `GEMINI_API_KEY` to `worker/.env` to enable this feature.",
            confidence=0,
            citations=[],
            suggested_questions=["What CDN is used?", "Is the site secure?", "What framework powers this site?"]
        )

    try:
        import google.generativeai as genai
        from .analyzers.inference import _build_context_document

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        context = _build_context_document(req.context)

        prompt = f"""You are an expert infrastructure analyst assistant. Answer the user's question based ONLY on the scan evidence provided. Be concise and visual-friendly (use short sentences, bullet points if needed). If the evidence does not support an answer, say so clearly.

=== SCAN EVIDENCE ===
{context}
=====================

QUESTION: {req.question}

Respond in this exact JSON format (no markdown, no extra text):
{{
  "answer": "concise answer string (max 3 sentences)",
  "confidence": int (0-100 based on evidence strength),
  "citations": ["specific evidence item 1", "specific evidence item 2"],
  "suggested_questions": ["follow-up question 1", "follow-up question 2"]
}}"""

        response = model.generate_content(prompt)
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        return AskResponse(**result)

    except Exception as e:
        return AskResponse(
            answer=f"Could not process your question. Please try again.",
            confidence=0,
            citations=[],
            suggested_questions=["What CDN is used?", "What framework is this built on?"]
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
