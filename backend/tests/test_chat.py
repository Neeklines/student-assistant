import io
from unittest.mock import patch, MagicMock

from app.models.chat import ChatMessage


def _mock_completion(text: str):
    completion = MagicMock()
    completion.choices = [MagicMock(message=MagicMock(content=text))]
    return completion


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
        assert any(p.get("type") == "text" for p in parts)
        image_part = next(p for p in parts if p.get("type") == "image_url")
        assert image_part["image_url"]["url"].startswith("data:image/png;base64,")


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
