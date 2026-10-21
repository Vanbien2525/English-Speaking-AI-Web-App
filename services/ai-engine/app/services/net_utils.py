"""
Network utilities and fast circuit breakers for AI Engine microservice.
"""
import socket
from urllib.parse import urlparse


def is_service_reachable(url: str, timeout: float = 0.05) -> bool:
    """
    Fast, non-blocking check to verify if a TCP port is open.
    Returns False immediately if connection is refused or unreachable.
    """
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or (443 if parsed.scheme == "https" else 80)

        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            s.connect((host, port))
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False
