"""
FactoryOS AI service — FastAPI entry point.

Responsibilities:
- /ocr       — receipt/bill extraction via Tesseract + Claude post-processing
- /insights  — anomaly detection and cash flow forecasting with Pandas
- /assistant — natural language queries on the business using Claude

Called internally by NestJS via HTTP.
Never exposed to the public internet.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import assistant, insights, ocr

app = FastAPI(
    title="FactoryOS AI Service",
    description="Internal AI microservice for OCR, insights, and assistant.",
    version="0.1.0",
)

allowed_origins = os.environ.get("CORS_ORIGIN", "http://localhost:4000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
app.include_router(insights.router, prefix="/insights", tags=["insights"])
app.include_router(assistant.router, prefix="/assistant", tags=["assistant"])


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "factoryos-ai",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
