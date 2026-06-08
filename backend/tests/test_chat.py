import io
import json
from unittest.mock import patch, MagicMock

from app.models.calendar_event import CalendarEvent
from app.models.chat import ChatMessage


def _mock_completion(text: str, tool_calls=None):
    completion = MagicMock()
    message = MagicMock(content=text, tool_calls=tool_calls)
    completion.choices = [MagicMock(message=message)]
    return completion


def _mock_stream_event(content=None, tool_calls=None):
    event = MagicMock()
    delta = MagicMock()
    delta.content = content
    delta.tool_calls = tool_calls
    event.choices = [MagicMock(delta=delta)]
    return event


def _tool_call(name: str, arguments: dict, call_id: str = "call_1"):
    tc = MagicMock()
    tc.id = call_id
    tc.function = MagicMock(name=name, arguments=json.dumps(arguments))
    tc.function.name = name
    return tc


def _stream_tool_delta(name: str, arguments: dict, call_id: str = "call_1"):
    tool_delta = MagicMock()
    tool_delta.index = 0
    tool_delta.id = call_id
    tool_delta.function = MagicMock()
    tool_delta.function.name = name
    tool_delta.function.arguments = json.dumps(arguments)
    return tool_delta


def _register_and_login(client, email="chat@test.com", password="secret"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_chat_requires_auth(client):
    response = client.post(
        "/api/chat/",
        data={"session_id": "s0", "message": "hi"},
    )
    assert response.status_code in (401, 403)


def test_chat_text_only(client, db):
    token = _register_and_login(client)

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.return_value = _mock_completion("Hello back!")

        response = client.post(
            "/api/chat/",
            data={"session_id": "s1", "message": "Hi Buddy"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert response.json() == {"response": "Hello back!"}

    rows = db.query(ChatMessage).order_by(ChatMessage.id).all()
    assert [(r.role, r.content) for r in rows] == [
        ("user", "Hi Buddy"),
        ("assistant", "Hello back!"),
    ]
    assert all(r.user_id is not None for r in rows)
    assert all(r.created_at is not None for r in rows)


def test_chat_stream_text_only(client, db):
    token = _register_and_login(client, email="stream@test.com")

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.return_value = [
            _mock_stream_event("Hel"),
            _mock_stream_event("lo"),
        ]

        response = client.post(
            "/api/chat/stream",
            data={"session_id": "stream1", "message": "Hi Buddy"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert 'event: chunk\ndata: {"text": "Hel"}' in response.text
    assert 'event: chunk\ndata: {"text": "lo"}' in response.text
    assert "event: done" in response.text

    rows = db.query(ChatMessage).order_by(ChatMessage.id).all()
    assert [(r.role, r.content) for r in rows] == [
        ("user", "Hi Buddy"),
        ("assistant", "Hello"),
    ]


def test_chat_with_image(client, db):
    token = _register_and_login(client)
    fake_png = b"\x89PNG\r\n\x1a\nfakebytes"

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.return_value = _mock_completion("Got it.")

        response = client.post(
            "/api/chat/",
            data={"session_id": "s2", "message": "Look at this"},
            files={"image": ("note.png", io.BytesIO(fake_png), "image/png")},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json() == {"response": "Got it."}

        sent_messages = instance.chat.completions.create.call_args.kwargs["messages"]
        user_msg = sent_messages[-1]
        assert user_msg["role"] == "user"
        parts = user_msg["content"]
        assert isinstance(parts, list)
        text_parts = [p for p in parts if p.get("type") == "text"]
        assert any("plan zajęć" in p.get("text", "") for p in text_parts)
        image_part = next(p for p in parts if p.get("type") == "image_url")
        assert image_part["image_url"]["url"].startswith("data:image/png;base64,")
        assert image_part["image_url"]["detail"] == "high"


def test_chat_rejects_unsupported_image_type(client):
    token = _register_and_login(client, email="pdf@test.com")

    response = client.post(
        "/api/chat/",
        data={"session_id": "s3", "message": "see attached"},
        files={"image": ("doc.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 415


def test_chat_rejects_oversized_image(client):
    token = _register_and_login(client, email="big@test.com")
    # 5MB + 1 byte
    oversized = b"\x89PNG\r\n\x1a\n" + b"\x00" * (5 * 1024 * 1024 + 1)

    response = client.post(
        "/api/chat/",
        data={"session_id": "s4", "message": "huge"},
        files={"image": ("big.png", io.BytesIO(oversized), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 413


def test_chat_history_isolated_per_user(client, db):
    token_a = _register_and_login(client, email="a@test.com")
    token_b = _register_and_login(client, email="b@test.com")

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.return_value = _mock_completion("ok")

        # both users use the same session_id by accident
        client.post(
            "/api/chat/",
            data={"session_id": "shared", "message": "user A secret"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        client.post(
            "/api/chat/",
            data={"session_id": "shared", "message": "user B secret"},
            headers={"Authorization": f"Bearer {token_b}"},
        )

        # On B's call, the history passed to OpenAI must not contain A's content
        last_call_messages = instance.chat.completions.create.call_args.kwargs[
            "messages"
        ]
        history_text = " ".join(
            m["content"] if isinstance(m["content"], str) else ""
            for m in last_call_messages
        )
        assert "user A secret" not in history_text
        assert "user B secret" in history_text


def test_chat_includes_current_date_context(client):
    token = _register_and_login(client, email="date@test.com")

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.return_value = _mock_completion("ok")

        response = client.post(
            "/api/chat/",
            data={"session_id": "date1", "message": "Co mam zrobić jutro?"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    sent_messages = instance.chat.completions.create.call_args.kwargs["messages"]
    system_message = sent_messages[0]["content"]
    assert "Aktualna data i czas:" in system_message
    assert "Europe/Warsaw" in system_message
    assert '"dziś", "jutro"' in system_message


def test_chat_tool_call_creates_calendar_event(client, db):
    """Model asks to create an event, gets the tool result, then replies in text."""
    token = _register_and_login(client, email="tools@test.com")

    create_args = {
        "title": "Algebra study block",
        "start_time": "2026-06-08T09:00:00",
        "end_time": "2026-06-08T10:30:00",
        "event_type": "study",
        "priority": "high",
    }

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.side_effect = [
            _mock_completion(
                text="", tool_calls=[_tool_call("create_event", create_args)]
            ),
            _mock_completion(text="Dodałem blok nauki algebry na poniedziałek."),
        ]

        response = client.post(
            "/api/chat/",
            data={"session_id": "tool1", "message": "Zaplanuj mi naukę algebry"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert "algebry" in response.json()["response"]

    # Event landed in DB and is attributed to AI
    events = db.query(CalendarEvent).all()
    assert len(events) == 1
    assert events[0].title == "Algebra study block"
    assert events[0].created_by == "ai"

    # Two OpenAI calls: first with no tool reply, second with tool message in history
    second_call_messages = instance.chat.completions.create.call_args_list[1].kwargs[
        "messages"
    ]
    assert any(m.get("role") == "tool" for m in second_call_messages)


def test_chat_stream_tool_call_creates_calendar_event(client, db):
    token = _register_and_login(client, email="stream-tools@test.com")

    create_args = {
        "title": "Physics review",
        "start_time": "2026-06-08T12:00:00",
        "end_time": "2026-06-08T13:00:00",
        "event_type": "study",
    }

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.side_effect = [
            [
                _mock_stream_event(
                    tool_calls=[_stream_tool_delta("create_event", create_args)]
                )
            ],
            [_mock_stream_event("Dodałem "), _mock_stream_event("powtórkę.")],
        ]

        response = client.post(
            "/api/chat/stream",
            data={"session_id": "stream-tool1", "message": "Dodaj fizykę"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert 'event: chunk\ndata: {"text": "Dodałem "}' in response.text
    assert 'event: chunk\ndata: {"text": "powtórkę."}' in response.text

    events = db.query(CalendarEvent).all()
    assert len(events) == 1
    assert events[0].title == "Physics review"
    assert events[0].created_by == "ai"

    rows = db.query(ChatMessage).order_by(ChatMessage.id).all()
    assert rows[-1].role == "assistant"
    assert rows[-1].content == "Dodałem powtórkę."


def test_chat_tool_error_does_not_crash(client, db):
    """If a tool raises, the error string is fed back to the model."""
    token = _register_and_login(client, email="err@test.com")

    bad_args = {
        "title": "Backwards event",
        "start_time": "2026-06-08T15:00:00",
        "end_time": "2026-06-08T09:00:00",  # before start_time
    }

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.side_effect = [
            _mock_completion(
                text="", tool_calls=[_tool_call("create_event", bad_args)]
            ),
            _mock_completion(text="Nie udało się dodać — koniec przed początkiem."),
        ]

        response = client.post(
            "/api/chat/",
            data={"session_id": "tool2", "message": "Dodaj coś"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert db.query(CalendarEvent).count() == 0

    # The error was passed back to the model as a tool message
    second_call_messages = instance.chat.completions.create.call_args_list[1].kwargs[
        "messages"
    ]
    tool_msg = next(m for m in second_call_messages if m.get("role") == "tool")
    assert "end_time must be after start_time" in tool_msg["content"]


def test_chat_system_prompt_has_travel_and_summary_rules(client):
    token = _register_and_login(client, email="buffer@test.com")

    with patch("app.services.ai_agent.OpenAI") as openai_cls:
        instance = openai_cls.return_value
        instance.chat.completions.create.return_value = _mock_completion("ok")

        response = client.post(
            "/api/chat/",
            data={"session_id": "buffer1", "message": "Zaplanuj mi jutro"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    sent_messages = instance.chat.completions.create.call_args.kwargs["messages"]
    system_message = sent_messages[0]["content"]
    assert "dojazd" in system_message.lower()
    assert "NIGDY nie twórz" in system_message
    assert "podsumuj konkretnie" in system_message
