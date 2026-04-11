"""Receipt and bill OCR — Tesseract extraction + Claude structuring."""
from __future__ import annotations

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

from services.ocr_service import OcrService

router = APIRouter()
_service = OcrService()


class OcrResult(BaseModel):
    vendor_name: str | None
    total_amount_paise: int | None
    gst_amount_paise: int | None
    gstin: str | None
    invoice_date: str | None
    raw_text: str


@router.post("/scan", response_model=OcrResult)
async def scan_receipt(file: UploadFile) -> OcrResult:
    """Scan a receipt or invoice image and return structured fields."""
    image_bytes = await file.read()
    return await _service.extract(image_bytes)
