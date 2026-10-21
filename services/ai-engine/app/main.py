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
