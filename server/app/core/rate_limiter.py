import time
from typing import Callable

import redis
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.celery_app import REDIS_URL


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Simple fixed-window rate limiter backed by Redis.
    Primarily protects /auth endpoints and webhooks from brute force.
    """

    def __init__(self, app, limit: int = 60, window_seconds: int = 60) -> None:
        super().__init__(app)
        self.limit = limit
        self.window = window_seconds
        self.client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        if not (
            path.startswith("/api/v1/auth")
            or path.startswith("/webhooks")
            or path.startswith("/api/v1/webhooks")
        ):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        key = f"rl:{client_ip}:{path}:{int(time.time() // self.window)}"

        try:
            current = self.client.incr(key)
            if current == 1:
                self.client.expire(key, self.window)
        except Exception:
            # If Redis is unavailable, fail open.
            return await call_next(request)

        if current > self.limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please slow down.",
            )

        return await call_next(request)

