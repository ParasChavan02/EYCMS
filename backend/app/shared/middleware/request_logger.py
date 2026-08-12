from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import time
import logging

logger = logging.getLogger("request_logger")
logging.basicConfig(level=logging.INFO)

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs latency, endpoint paths, and status codes of all HTTP calls.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"[{request.method}] {request.url.path} - Status: {response.status_code} - Duration: {process_time:.4f}s"
        )
        return response
