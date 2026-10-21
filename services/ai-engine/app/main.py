"""
AI Speaking Tutor Microservice Entry Point.
FastAPI Application serving Phoneme Assessment & 3D Viseme Control.
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_speaking_tutor")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook for model warmup and resource cleanup."""
    logger.info("Initializing AI Speaking Tutor Engine...")
    logger.info(f"Target Model Directory: {settings.model_dir}")
    logger.info(f"Ollama Target URL: {settings.ollama_url}")

    # Warm up Ollama in background so first user request doesn't suffer cold start
    import asyncio
    async def _warmup_ollama():
        try:
            from app.services.net_utils import is_service_reachable
            import httpx
            if is_service_reachable(settings.ollama_url, timeout=0.1):
                logger.info(f"Pre-warming Ollama model '{settings.ollama_model}'...")
                async with httpx.AsyncClient(timeout=30.0) as client:
                    await client.post(
                        f"{settings.ollama_url}/api/generate",
                        json={
                            "model": settings.ollama_model,
                            "prompt": "hi",
                            "stream": False,
                            "options": {"num_predict": 1},
                        },
                    )
                logger.info("Ollama model successfully pre-warmed in memory.")
        except Exception as e:
            logger.warning(f"Ollama warmup skipped: {e}")

    asyncio.create_task(_warmup_ollama())

    yield
    logger.info("Shutting down AI Speaking Tutor Engine.")


app = FastAPI(
    title="AI Speaking Tutor 3D Engine",
    description="Microservice providing real-time pronunciation assessment, phoneme alignment, and 3D viseme timelines.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
