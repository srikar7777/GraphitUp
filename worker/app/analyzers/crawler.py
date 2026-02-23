import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from urllib.parse import urlparse
import time
from typing import Dict, Any, List

async def analyze_crawl(url: str, headless: bool = True, timeout_ms: int = 30000) -> Dict[str, Any]:
    result = {
        "pages": 1,
        "resources": {
            "scripts": 0,
            "stylesheets": 0,
            "images": 0,
            "fonts": 0,
            "other": 0
        },
        "thirdParty": [],
        "performance": {
            "loadTime": 0,
            "domContentLoaded": 0,
            "largestContentfulPaint": 0,
        },
        "error": None
    }
    
    try:
        parsed_url = urlparse(url)
        base_domain = parsed_url.netloc.replace("www.", "")
        
        # Keep track of unique domains we make requests to
        third_party_domains = set()
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=headless)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 GraphitupScan/1.0",
                viewport={'width': 1280, 'height': 800}
            )
            page = await context.new_page()

            # Network request listener
            page.on("request", lambda request: track_request(request, result, third_party_domains, base_domain))

            start_time = time.time()
            
            # Navigate to the URL
            response = await page.goto(
                url, 
                wait_until="networkidle",
                timeout=timeout_ms
            )
            
            end_time = time.time()
            
            if not response:
                result["error"] = "No response received"
                await browser.close()
                return result

            # Performance Metrics
            result["performance"]["loadTime"] = round((end_time - start_time) * 1000)
            
            # Try to grab navigation timing API metrics from the browser
            timing_json = await page.evaluate('''() => {
                const timing = performance.getEntriesByType('navigation')[0];
                return timing ? JSON.stringify({
                    domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
                    loadEventEnd: timing.loadEventEnd
                }) : null;
            }''')
            
            if timing_json:
                import json
                timing = json.loads(timing_json)
                result["performance"]["domContentLoaded"] = round(timing.get("domContentLoadedEventEnd", 0))
            
            # Map discovered third party domains to known services
            result["thirdParty"] = categorize_domains(list(third_party_domains))

            await browser.close()

    except PlaywrightTimeoutError:
        result["error"] = f"Page load timed out after {timeout_ms}ms"
    except Exception as e:
        result["error"] = f"Crawl Error: {str(e)}"

    return result


def track_request(request, result: Dict, third_party_domains: set, base_domain: str):
    # Categorize resource type
    req_type = request.resource_type
    if req_type in ["script", "document"]:
        result["resources"]["scripts"] += 1
    elif req_type == "stylesheet":
        result["resources"]["stylesheets"] += 1
    elif req_type == "image":
        result["resources"]["images"] += 1
    elif req_type == "font":
        result["resources"]["fonts"] += 1
    else:
        result["resources"]["other"] += 1
        
    # Check if third party
    try:
        req_url = urlparse(request.url)
        req_domain = req_url.netloc.replace("www.", "")
        
        if req_domain and req_domain != base_domain and not req_domain.endswith(f".{base_domain}"):
            third_party_domains.add(req_domain)
    except:
        pass


def categorize_domains(domains: List[str]) -> List[Dict[str, str]]:
    """Helper to try and map a domain to a known 3rd party service."""
    categorized = []
    
    # Very basic static mapping dictionary for demonstration
    # Real implementation might use wappalyzer or a larger ruleset
    known_services = {
        "google-analytics.com": {"name": "Google Analytics", "category": "Analytics"},
        "googletagmanager.com": {"name": "Google Tag Manager", "category": "Tag Manager"},
        "sentry.io": {"name": "Sentry", "category": "Monitoring"},
        "stripe.com": {"name": "Stripe", "category": "Payment"},
        "intercom.io": {"name": "Intercom", "category": "Support"},
        "fonts.googleapis.com": {"name": "Google Fonts", "category": "Typography"},
        "fonts.gstatic.com": {"name": "Google Fonts", "category": "Typography"},
        "cdn.jsdelivr.net": {"name": "jsDelivr", "category": "CDN"},
        "cdnjs.cloudflare.com": {"name": "CDNJS", "category": "CDN"},
        "unpkg.com": {"name": "Unpkg", "category": "CDN"},
        "connect.facebook.net": {"name": "Meta Pixel", "category": "Marketing"},
        "youtube.com": {"name": "YouTube Embedded", "category": "Media"},
        "vimeo.com": {"name": "Vimeo Embedded", "category": "Media"}
    }
    
    for domain in domains:
        matched = False
        for known_domain, info in known_services.items():
            if known_domain in domain:
                categorized.append({
                    "name": info["name"],
                    "category": info["category"],
                    "domain": domain
                })
                matched = True
                break
                
        if not matched:
            categorized.append({
                "name": domain.split('.')[0].capitalize(),
                "category": "External Service",
                "domain": domain
            })
            
    return categorized
