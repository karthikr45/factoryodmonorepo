"""Natural language assistant powered by Claude."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from services.assistant_service import AssistantService

router = APIRouter()
_service = AssistantService()


class AssistantRequest(BaseModel):
    org_id: str
    user_id: str
    question: str


class AssistantResponse(BaseModel):
    answer: str
    sources: list[str] = []


@router.post("/ask", response_model=AssistantResponse)
async def ask(req: AssistantRequest) -> AssistantResponse:
    """Ask the FactoryOS assistant a question about your business."""
    result = await _service.answer(
        org_id=req.org_id,
        user_id=req.user_id,
        question=req.question,
    )
    return AssistantResponse(**result)
