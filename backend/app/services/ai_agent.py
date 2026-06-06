import base64
from typing import Optional
from sqlalchemy.orm import Session
from openai import OpenAI
from dotenv import load_dotenv
from app.models.chat import ChatMessage

load_dotenv()

MODEL = "gpt-4o-mini"

SYSTEM_INSTRUCTION = """
Jesteś osobistym asystentem studenta ds. produktywności i układania planu dnia.
Pomagaj ustalać realistyczny harmonogram, uwzględniaj przerwy na jedzenie,
sen i odpoczynek. Bądź motywujący i wspierający.
"""


def _build_user_content(
    text: str, image_bytes: Optional[bytes], image_mime_type: Optional[str]
):
    """Multimodal user message: text + optional image as data URL."""
    if not image_bytes:
        return text or ""

    mime = image_mime_type or "image/jpeg"
    b64 = base64.b64encode(image_bytes).decode("ascii")
    parts = []
    if text:
        parts.append({"type": "text", "text": text})
    parts.append(
        {
            "type": "image_url",
            "image_url": {"url": f"data:{mime};base64,{b64}"},
        }
    )
    return parts


def get_agent_response(
    user_id: int,
    session_id: str,
    user_text: str,
    db: Session,
    image_bytes: Optional[bytes] = None,
    image_mime_type: Optional[str] = None,
) -> str:
    history_rows = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.session_id == session_id,
        )
        .order_by(ChatMessage.id)
        .all()
    )

    messages = [{"role": "system", "content": SYSTEM_INSTRUCTION.strip()}]
    for row in history_rows:
        messages.append({"role": row.role, "content": row.content})

    messages.append(
        {
            "role": "user",
            "content": _build_user_content(user_text, image_bytes, image_mime_type),
        }
    )

    stored_user = user_text if user_text else "[image]"
    db.add(
        ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=stored_user,
        )
    )
    db.commit()

    client = OpenAI()
    completion = client.chat.completions.create(model=MODEL, messages=messages)
    reply = completion.choices[0].message.content or ""

    db.add(
        ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=reply,
        )
    )
    db.commit()

    return reply
