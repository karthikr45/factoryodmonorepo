"""Insights service — stub. Future home of Pandas anomaly + forecast pipelines."""
from __future__ import annotations


class InsightsService:
    async def detect_anomalies(self, org_id: str, window_days: int) -> list[dict]:  # noqa: ARG002
        return []

    async def forecast_cashflow(self, org_id: str, horizon_days: int) -> list[dict]:  # noqa: ARG002
        return []
