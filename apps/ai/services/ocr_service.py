"""OCR service — stub. To be implemented in a later session."""
from __future__ import annotations


class OcrService:
    async def extract(self, image_bytes: bytes) -> dict:  # noqa: ARG002
        """Run Tesseract → pass raw text to Claude → return structured invoice fields."""
        return {
            "vendor_name": None,
            "total_amount_paise": None,
            "gst_amount_paise": None,
            "gstin": None,
            "invoice_date": None,
            "raw_text": "",
        }
