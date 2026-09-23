from types import SimpleNamespace

from backend.ai import agent


def test_load_env_file_reads_values_without_overriding_existing_environment(
    monkeypatch, tmp_path
):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "OPENAI_API_KEY=file-key\nOPENAI_MODEL=file-model\n# ignored\n",
        encoding="utf-8",
    )
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_MODEL", "existing-model")

    agent._load_env_file(env_file)

    assert agent.os.environ["OPENAI_API_KEY"] == "file-key"
    assert agent.os.environ["OPENAI_MODEL"] == "existing-model"


def test_agent_calls_engine_tool_before_writing(monkeypatch):
    calls = []
    first = SimpleNamespace(
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_scenario_analysis",
                call_id="call-1",
                arguments="{}",
            )
        ]
    )
    second = SimpleNamespace(
        output_text="Сильнее всего сценарий поддерживает социальную инфраструктуру слабого района."
    )

    class FakeResponses:
        def create(self, **kwargs):
            calls.append(kwargs)
            return first if len(calls) == 1 else second

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr(
        agent, "OpenAI", lambda **_kwargs: SimpleNamespace(responses=FakeResponses())
    )
    monkeypatch.setattr(agent, "render_fallback", lambda _facts: "fallback")

    mode, text = agent.explain({"score": 56.543})
    assert mode == "ai"
    assert (
        text
        == "fallback\n\nКомментарий AI. Сильнее всего сценарий поддерживает социальную инфраструктуру слабого района."
    )
    assert calls[0]["tool_choice"]["name"] == "get_scenario_analysis"
    assert calls[1]["input"][-1]["type"] == "function_call_output"
    assert calls[1]["input"][-1]["call_id"] == "call-1"


def test_agent_rejects_number_even_when_it_appears_elsewhere_in_tool_output(
    monkeypatch,
):
    calls = []
    first = SimpleNamespace(
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_scenario_analysis",
                call_id="call-1",
                arguments="{}",
            )
        ]
    )
    second = SimpleNamespace(output_text="Итоговый Score 100.")

    class FakeResponses:
        def create(self, **kwargs):
            calls.append(kwargs)
            return first if len(calls) == 1 else second

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(
        agent, "OpenAI", lambda **_kwargs: SimpleNamespace(responses=FakeResponses())
    )
    monkeypatch.setattr(
        agent, "render_fallback", lambda _facts: "Проверенное объяснение"
    )

    assert agent.explain({"score": 56.543, "budget": 100}) == (
        "fallback",
        "Проверенное объяснение",
    )


def test_agent_rejects_unauthorized_swap(monkeypatch):
    first = SimpleNamespace(
        output=[
            SimpleNamespace(
                type="function_call",
                name="get_scenario_analysis",
                call_id="call-1",
                arguments="{}",
            )
        ]
    )
    second = SimpleNamespace(output_text="Замените M7 на M3.")
    calls = []

    class FakeResponses:
        def create(self, **kwargs):
            calls.append(kwargs)
            return first if len(calls) == 1 else second

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(
        agent, "OpenAI", lambda **_kwargs: SimpleNamespace(responses=FakeResponses())
    )
    monkeypatch.setattr(
        agent, "render_fallback", lambda _facts: "Проверенное объяснение"
    )

    assert agent.explain({"score": 56.543}) == ("fallback", "Проверенное объяснение")
