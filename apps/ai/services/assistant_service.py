"""Assistant service — Claude-powered natural language interface. Stub."""
from __future__ import annotations

import os


class AssistantService:
    def __init__(self) -> None:
        self.api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        self.model = os.environ.get("ANTHROPIC_MODEL", "claude-opus-4-6")

    async def answer(self, org_id: str, user_id: str, question: str) -> dict:  # noqa: ARG002
        """
        To be implemented: retrieve business context for org, build Claude prompt,
        call the API with prompt caching enabled, return answer + source citations.
        """
        return {
            "answer": "The assistant is not yet wired up. Configure ANTHROPIC_API_KEY first.",
            "sources": [],
        }
