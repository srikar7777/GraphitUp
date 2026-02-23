import os
import json
from typing import Dict, Any

def _build_context_document(scan_data: Dict[str, Any]) -> str:
    """Converts raw scan data into a concise, structured context string for the LLM."""
    http_data = scan_data.get("http", {}).get("data", {})
    dns_data = scan_data.get("dns", {}).get("data", {})
    tls_data = scan_data.get("tls", {}).get("data", {})
    crawl_data = scan_data.get("crawl", {}).get("data", {})

    parts = []

    # DNS Evidence
    if dns_data:
        parts.append(f"[DNS] Provider/CDN: {dns_data.get('provider', 'Unknown')}")
        a_records = dns_data.get("records", {}).get("A", [])
        if a_records:
            parts.append(f"[DNS] IP Address(es): {', '.join(a_records)}")
        ns = dns_data.get("records", {}).get("NS", [])
        if ns:
            parts.append(f"[DNS] Nameservers: {', '.join(ns)}")

    # TLS Evidence
    if tls_data:
        parts.append(f"[TLS] Protocol: {tls_data.get('version', 'Unknown')}")
        parts.append(f"[TLS] Certificate Issuer: {tls_data.get('certificate_issuer', 'Unknown')}")
        parts.append(f"[TLS] HSTS Enabled: {tls_data.get('hsts', False)}")

    # HTTP Evidence
    if http_data:
        headers = http_data.get("headers", {})
        tech = http_data.get("technologies", {})
        parts.append(f"[HTTP] Status Code: {http_data.get('status_code', 'Unknown')}")
        parts.append(f"[HTTP] Server Header: {headers.get('server', 'Not disclosed')}")
        parts.append(f"[HTTP] X-Powered-By: {headers.get('x-powered-by', 'Not disclosed')}")
        if tech.get("framework"):
            parts.append(f"[HTTP] Detected Framework: {tech['framework']}")
        if tech.get("language"):
            parts.append(f"[HTTP] Detected Language: {tech['language']}")

    # Crawl Evidence
    if crawl_data:
        third_party = crawl_data.get("third_party", [])
        if third_party:
            parts.append(f"[CRAWL] Third-party domains: {', '.join(third_party[:10])}")
        resources = crawl_data.get("resources", {})
        parts.append(f"[CRAWL] Scripts loaded: {resources.get('scripts', 0)}")
        performance = crawl_data.get("performance", {})
        if performance.get("load_time_ms"):
            parts.append(f"[CRAWL] Page load time: {performance['load_time_ms']}ms")

    return "\n".join(parts) if parts else "No scan evidence available."


def _mock_inference(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback mock when Gemini API key is not configured."""
    http_data = scan_data.get("http", {}).get("data", {})
    dns_data = scan_data.get("dns", {}).get("data", {})
    framework = http_data.get("technologies", {}).get("framework", "Unknown / Custom SPA")
    hoster = http_data.get("technologies", {}).get("hosting", "Unknown Hosting")
    cdn = dns_data.get("provider", "Unknown CDN")
    return {
        "architecture": {
            "type": "Modern Web Application",
            "frontend": {"framework": framework, "rendering": "CSR/SSR Hybrid (implied)"},
            "backend": {"runtime": "Unknown (behind proxy)", "database": "Unknown"},
            "infrastructure": {"hosting": hoster, "cdn": cdn, "security": "WAF enabled (implied)"}
        },
        "confidence": {"overall": 75, "frontend": 90, "backend": 40, "infrastructure": 85},
        "recommendations": ["Gemini AI key not configured — showing mock inference."]
    }


def analyze_inference(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    AI-powered inference engine using Google Gemini.
    Analyzes DNS, TLS, HTTP, and Crawl data to determine the tech stack.
    Falls back to mock if GEMINI_API_KEY is not set.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return _mock_inference(scan_data)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        context = _build_context_document(scan_data)

        prompt = f"""You are an expert infrastructure analyst. Based ONLY on the following scan evidence, determine the website's technology stack and architecture. Do NOT guess beyond what the evidence supports.

=== SCAN EVIDENCE ===
{context}
=====================

Respond in this exact JSON format (no markdown, no extra text):
{{
  "architecture": {{
    "type": "string (e.g. Modern Web App, Microservices, Legacy Monolith)",
    "frontend": {{
      "framework": "string (framework name or Unknown)",
      "rendering": "string (SSR, CSR, SSG, or Hybrid)"
    }},
    "backend": {{
      "runtime": "string (e.g. Node.js, Go, or Unknown)",
      "framework": "string or null",
      "database": "string or Unknown"
    }},
    "infrastructure": {{
      "hosting": "string (e.g. AWS, Vercel, or Unknown)",
      "cdn": "string (CDN name or None)",
      "security": "string (summary of security posture)"
    }}
  }},
  "confidence": {{
    "overall": int (0-100),
    "frontend": int (0-100),
    "backend": int (0-100),
    "infrastructure": int (0-100)
  }},
  "recommendations": ["short insight 1", "short insight 2"]
}}"""

        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Clean potential markdown code fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        return result

    except Exception as e:
        # Graceful fallback on any error
        fallback = _mock_inference(scan_data)
        fallback["recommendations"] = [f"AI inference failed: {str(e)[:100]}. Showing heuristic analysis."]
        return fallback
