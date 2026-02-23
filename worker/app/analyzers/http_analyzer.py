import aiohttp
import time
import asyncio
from typing import Dict, Any

async def analyze_http(url: str) -> Dict[str, Any]:
    result = {
        "statusCode": None,
        "responseTime": 0,
        "headers": {},
        "technologies": {},
        "security": {},
        "error": None
    }
    
    # We want to identify the server layer without downloading large payloads if possible,
    # but a GET request is best to see full headers and potentially infer tech from bodies.
    # To be safe, we'll do a HEAD request first or a GET with a streaming response.
    # We will do a simple GET with a hard timeout.
    
    start_time = time.time()
    
    timeout = aiohttp.ClientTimeout(total=15)
    
    try:
        # Use a custom user agent to avoid basic blocks
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 GraphitupScan/1.0"
        }
        
        async with aiohttp.ClientSession(
            timeout=timeout, 
            headers=headers,
            connector=aiohttp.TCPConnector(ssl=False)
        ) as session:
            async with session.get(url, allow_redirects=True) as response:
                
                # Time to first byte (approximate)
                end_time = time.time()
                result["responseTime"] = round((end_time - start_time) * 1000)
                
                result["statusCode"] = response.status
                
                # Process headers
                for key, value in response.headers.items():
                    k = key.lower()
                    result["headers"][k] = value
                    
                    # Common Security Headers
                    sec_headers = [
                        'strict-transport-security', 
                        'content-security-policy',
                        'x-frame-options',
                        'x-content-type-options',
                        'x-xss-protection',
                        'permissions-policy'
                    ]
                    
                    if k in sec_headers:
                        result["security"][key] = value
                        
                # Basic Server/Tech inference from headers
                server_hdr = result["headers"].get("server", "").lower()
                x_powered_by = result["headers"].get("x-powered-by", "").lower()
                via = result["headers"].get("via", "").lower()
                
                # Check Server
                if "cloudflare" in server_hdr:
                    result["technologies"]["server"] = "Cloudflare"
                    result["technologies"]["cdn"] = "Cloudflare"
                elif "nginx" in server_hdr:
                    result["technologies"]["server"] = "Nginx"
                elif "apache" in server_hdr:
                    result["technologies"]["server"] = "Apache"
                elif "iis" in server_hdr:
                    result["technologies"]["server"] = "Microsoft IIS"
                elif "envoy" in server_hdr:
                    result["technologies"]["server"] = "Envoy Proxy"
                elif "vercel" in server_hdr:
                    result["technologies"]["hosting"] = "Vercel"
                    
                # Check Framework/Powered-By
                if "next.js" in x_powered_by:
                    result["technologies"]["framework"] = "Next.js"
                elif "express" in x_powered_by:
                    result["technologies"]["framework"] = "Express.js"
                elif "php" in x_powered_by:
                    result["technologies"]["language"] = "PHP"
                elif "asp.net" in x_powered_by:
                    result["technologies"]["framework"] = "ASP.NET"
                
                # Check Via/CDN
                if "cloudfront" in via:
                    result["technologies"]["cdn"] = "AWS CloudFront"
                elif "fastly" in via:
                    result["technologies"]["cdn"] = "Fastly"
                elif "akamai" in via:
                    result["technologies"]["cdn"] = "Akamai"
                    
    except asyncio.TimeoutError:
        result["error"] = "HTTP request timed out"
    except Exception as e:
        result["error"] = f"HTTP Error: {str(e)}"
        
    return result
