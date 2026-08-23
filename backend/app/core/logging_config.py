"""Structured logging configuration for RiskGraph."""
import logging
import sys
from typing import Any

try:
    import structlog  # type: ignore
    HAS_STRUCTLOG = True
except ImportError:
    HAS_STRUCTLOG = False


def configure_logging(log_level: str = "INFO", log_format: str = "json") -> None:
    """Configure application-wide structured logging."""
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    logging.basicConfig(
        stream=sys.stdout,
        level=numeric_level,
        format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    # Suppress noisy third-party loggers
    for noisy in ("uvicorn.access", "httpx", "aiosqlite"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger."""
    return logging.getLogger(name)
