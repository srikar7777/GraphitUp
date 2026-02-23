import ssl
import socket
import cryptography.x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID
import urllib.parse
from typing import Dict, Any

def analyze_tls(url: str) -> Dict[str, Any]:
    try:
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.hostname
        port = parsed.port or 443
        
        if parsed.scheme != 'https':
            return {
                "error": "Not an HTTPS URL",
                "hsts": False
            }
            
        if not hostname:
            return {"error": "Invalid URL"}
            
    except Exception as e:
        return {"error": str(e)}

    result = {
        "version": None,
        "cipher": None,
        "certificate": {},
        "error": None
    }

    context = ssl.create_default_context()
    
    # Do not fail on self-signed certs (we still want to analyze them, though we should note they are invalid)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE

    try:
        with socket.create_connection((hostname, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                
                # Get TLS version and cipher suite
                result["version"] = ssock.version()
                result["cipher"] = ssock.cipher()[0] if ssock.cipher() else None
                
                # Get the raw certificate bytes
                der_cert = ssock.getpeercert(binary_form=True)
                
                if der_cert:
                    # Parse X.509 using cryptography
                    cert = cryptography.x509.load_der_x509_certificate(der_cert, default_backend())
                    
                    # Extract Issuer
                    issuer_cn = "Unknown"
                    for attribute in cert.issuer:
                        if attribute.oid == NameOID.COMMON_NAME:
                            issuer_cn = attribute.value
                            break
                    
                    # Extract Subject
                    subject_cn = "Unknown"
                    for attribute in cert.subject:
                        if attribute.oid == NameOID.COMMON_NAME:
                            subject_cn = attribute.value
                            break
                    
                    result["certificate"] = {
                        "issuer": issuer_cn,
                        "subject": subject_cn,
                        "validFrom": cert.not_valid_before.isoformat() + "Z",
                        "validTo": cert.not_valid_after.isoformat() + "Z",
                        "serialNumber": format(cert.serial_number, 'x').upper(),
                        "signatureAlgorithm": cert.signature_algorithm_oid._name if hasattr(cert.signature_algorithm_oid, '_name') else "Unknown",
                    }
                    
    except socket.timeout:
        result["error"] = "Connection timed out"
    except Exception as e:
        result["error"] = f"TLS Error: {str(e)}"

    return result
