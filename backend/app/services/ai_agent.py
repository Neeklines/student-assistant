import base64
import json
from typing import Optional
from sqlalchemy.orm import Session
from openai import OpenAI
from dotenv import load_dotenv
from app.models.chat import ChatMessage
from app.services.calendar_tools import OPENAI_TOOLS, TOOL_FUNCTIONS

load_dotenv()

MODEL = "gpt-4o-mini"
MAX_TOOL_ITERATIONS = 5

SYSTEM_INSTRUCTION = """
Jesteś osobistym asystentem studenta ds. produktywności i układania planu dnia.
Pomagaj ustalać realistyczny harmonogram, uwzględniaj przerwy na jedzenie,
sen i odpoczynek. Bądź motywujący i wspierający.

Masz dostęp do kalendarza studenta przez funkcje (tools):
- list_events — sprawdź co już jest zaplanowane przed proponowaniem nowych bloków;
  zawsze rób to przed planowaniem dnia/tygodnia.
- create_event — dodaj wydarzenie do kalendarza. Daty/godziny w formacie ISO 8601
  (np. "2026-06-07T09:00:00"). Jeśli prośba jest niejasna (brak godziny, długości
  bloku, daty), dopytaj zanim wywołasz funkcję.
- update_event — edytuj istniejące wydarzenie (potrzebne `event_id`).
- delete_event — usuń wydarzenie. **Zawsze poproś użytkownika o potwierdzenie**
  przed wywołaniem, nawet jeśli wydaje się to oczywiste.

Po każdym wywołaniu funkcji podsumuj zwięźle co zmieniło się w kalendarzu.
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


def _execute_tool(name: str, arguments: dict, db: Session, user_id: int) -> dict:
    """Look up the tool by name and run it.

    Returns either the tool result dict or an ``{"error": ...}`` dict.
    """
    func = TOOL_FUNCTIONS.get(name)
    if not func:
        return {"error": f"unknown tool {name!r}"}
    try:
        return func(db=db, user_id=user_id, **arguments)
    except ValueError as e:
        return {"error": str(e)}
    except TypeError as e:
        return {"error": f"bad arguments: {e}"}


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

    # Tool-call dispatch loop. The model may call tools repeatedly before
    # producing a final text answer.
    for _ in range(MAX_TOOL_ITERATIONS):
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=OPENAI_TOOLS,
        )
        choice = completion.choices[0]
        msg = choice.message

        tool_calls = getattr(msg, "tool_calls", None)
        if not tool_calls:
            reply = msg.content or ""
            break

        # Append assistant's tool_call request, then each tool's result, then loop.
        messages.append(
            {
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls
                ],
            }
        )

        for tc in tool_calls:
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            result = _execute_tool(tc.function.name, args, db, user_id)
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result, ensure_ascii=False),
                }
            )
    else:
        # Loop exhausted without a plain reply.
        reply = (
            "Przepraszam, nie udało mi się dokończyć planowania w wyznaczonych "
            "krokach. Spróbujmy jeszcze raz."
        )

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
