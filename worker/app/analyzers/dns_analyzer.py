import dns.resolver
import dns.exception
import time
from typing import Dict, Any, List
import socket

def analyze_dns(url: str) -> Dict[str, Any]:
    # Extract hostname from URL
    # e.g. "https://www.example.com/path" -> "www.example.com"
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            raise ValueError("Invalid URL format")
    except Exception as e:
        return {"error": str(e)}

    result = {
        "hostname": hostname,
        "records": {},
        "provider": "Unknown",
        "responseTime": 0,
        "error": None
    }

    start_time = time.time()
    
    # Common record types to query
    record_types = ["A", "AAAA", "CNAME", "MX", "NS", "TXT"]
    
    resolver = dns.resolver.Resolver()
    resolver.timeout = 5.0
    resolver.lifetime = 5.0

    for record_type in record_types:
        try:
            answers = resolver.resolve(hostname, record_type)
            result["records"][record_type] = [str(rdata) for rdata in answers]
            
            # Basic provider inference from NS records
            if record_type == "NS":
                ns_records = result["records"]["NS"]
                ns_str = " ".join(ns_records).lower()
                
                if "cloudflare" in ns_str:
                    result["provider"] = "Cloudflare"
                elif "awsdns" in ns_str:
                    result["provider"] = "AWS Route 53"
                elif "googledomains" in ns_str or "google." in ns_str:
                    result["provider"] = "Google Cloud DNS"
                elif "azure" in ns_str:
                    result["provider"] = "Azure DNS"
                elif "digitalocean" in ns_str:
                    result["provider"] = "DigitalOcean"
                elif "namecheap" in ns_str:
                    result["provider"] = "Namecheap"
                elif "godaddy" in ns_str or "domaincontrol" in ns_str:
                    result["provider"] = "GoDaddy"

        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.NoNameservers):
            result["records"][record_type] = []
        except Exception as e:
            # We don't fail the whole scan just because one record type failed or timed out
            pass

    # Reverse lookup for IP
    if "A" in result["records"] and result["records"]["A"]:
        try:
            ip = result["records"]["A"][0]
            hostnames = socket.gethostbyaddr(ip)
            if hostnames and hostnames[0]:
                result["records"]["PTR"] = [hostnames[0]]
        except Exception:
            pass

    end_time = time.time()
    result["responseTime"] = round((end_time - start_time) * 1000)

    return result
