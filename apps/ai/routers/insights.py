"""Business insights — anomaly detection and cash flow prediction."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from services.insights_service import InsightsService

router = APIRouter()
_service = InsightsService()


class AnomalyRequest(BaseModel):
    org_id: str
    window_days: int = 30


class AnomalyResponse(BaseModel):
    anomalies: list[dict]


@router.post("/anomalies", response_model=AnomalyResponse)
async def detect_anomalies(req: AnomalyRequest) -> AnomalyResponse:
    anomalies = await _service.detect_anomalies(req.org_id, req.window_days)
    return AnomalyResponse(anomalies=anomalies)


class CashFlowRequest(BaseModel):
    org_id: str
    horizon_days: int = 30


class CashFlowResponse(BaseModel):
    projection: list[dict]


@router.post("/cashflow", response_model=CashFlowResponse)
async def forecast_cashflow(req: CashFlowRequest) -> CashFlowResponse:
    projection = await _service.forecast_cashflow(req.org_id, req.horizon_days)
    return CashFlowResponse(projection=projection)
