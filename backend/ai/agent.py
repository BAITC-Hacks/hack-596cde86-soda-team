"""OpenAI Responses function calling with a bounded fallback path."""

import json
import os
import re
from pathlib import Path

from openai import OpenAI, OpenAIError

from .fallback import render_fallback

PROMPT_PATH = Path(__file__).parent / "prompts" / "system.md"
TOOL = {
    "type": "function",
    "name": "get_scenario_analysis",
    "description": "Get authoritative simulation, marginal contributions, optimum and legal improving swaps for the current scenario.",
    "parameters": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": False,
    },
    "strict": True,
}


def explain(facts: dict) -> tuple[str, str]:
    fallback = render_fallback(facts)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "fallback", fallback
    try:
        client = OpenAI(api_key=api_key, timeout=12, max_retries=0)
        prompt = PROMPT_PATH.read_text(encoding="utf-8")
        request = [
            {
                "role": "user",
                "content": "Проанализируй выбранный сценарий и предложи улучшение.",
            }
        ]
        first = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5.6"),
            instructions=prompt,
            input=request,
            tools=[TOOL],
            tool_choice={"type": "function", "name": "get_scenario_analysis"},
        )
        calls = [
            item
            for item in first.output
            if item.type == "function_call" and item.name == TOOL["name"]
        ]
        if not calls:
            return "fallback", fallback
        request.extend(first.output)
        for item in calls:
            request.append(
                {
                    "type": "function_call_output",
                    "call_id": item.call_id,
                    "output": json.dumps(facts, ensure_ascii=False),
                }
            )
        second = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5.6"),
            instructions=prompt,
            input=request,
            tools=[TOOL],
            tool_choice="none",
        )
        text = second.output_text.strip()
        if not text or re.search(
            r"\d|\b(?:замен\w*|поменя\w*|вместо|выбер\w*)\b", text, re.IGNORECASE
        ):
            return "fallback", fallback
        return "ai", f"{fallback}\n\nКомментарий AI. {text}"
    except (OpenAIError, OSError, ValueError, TypeError, AttributeError):
        return "fallback", fallback
