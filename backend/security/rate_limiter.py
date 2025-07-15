from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)

# Rate limit error handler
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> Response:
    response = JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"}
    )
    response.headers["Retry-After"] = str(exc.retry_after)
    return response