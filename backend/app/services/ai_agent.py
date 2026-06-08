import base64
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Iterator, Optional
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage
from app.services.calendar_tools import OPENAI_TOOLS, TOOL_FUNCTIONS

load_dotenv()

MODEL = "gpt-5.4"
MAX_TOOL_ITERATIONS = 5
APP_TIMEZONE = ZoneInfo("Europe/Warsaw")

IMAGE_SCHEDULE_INSTRUCTION = """
Jeśli załączony obraz wygląda jak plan zajęć, siatka lekcji albo screenshot z
harmonogramem, najpierw odczytaj go jak tabelę. Zwróć uwagę na dni tygodnia,
godziny rozpoczęcia i zakończenia, nazwy przedmiotów, typ zajęć, sale, prowadzących
i grupy. Nie zgaduj pól, które są nieczytelne: oznacz je jako niepewne i dopytaj.
Zanim dodasz wydarzenia do kalendarza z takiego obrazu, pokaż rozpoznaną listę
pozycji i poproś użytkownika o potwierdzenie.
"""

SYSTEM_INSTRUCTION = """
Jesteś osobistym asystentem studenta ds. produktywności i układania planu dnia.
Pomagaj ustalać realistyczny harmonogram, uwzględniaj przerwy na jedzenie,
sen i odpoczynek. Bądź motywujący i wspierający.

Masz dostęp do kalendarza studenta przez funkcje (tools):
- list_events - sprawdź co już jest zaplanowane przed proponowaniem nowych bloków;
  zawsze rób to przed planowaniem dnia/tygodnia.
- create_event - dodaj wydarzenie do kalendarza. Daty/godziny w formacie ISO 8601
  (np. "2026-06-07T09:00:00"). Jeśli prośba jest niejasna (brak godziny, długości
  bloku, daty), dopytaj zanim wywołasz funkcję.
- update_event - edytuj istniejące wydarzenie (potrzebne `event_id`).
- delete_event - usuń wydarzenie. **Zawsze poproś użytkownika o potwierdzenie**
  przed wywołaniem, nawet jeśli wydaje się to oczywiste.

Planowanie a dojazd: gdy układasz kilka wydarzeń w różnych miejscach, zostaw
rozsądny odstęp między nimi na dojazd (np. 15–30 minut w obrębie miasta, więcej
przy większych odległościach). NIGDY nie twórz osobnego wydarzenia o nazwie
"dojazd", "przejazd", "travel" itp. — czas na dojazd to po prostu wolne miejsce
w kalendarzu, nie zaplanowana czynność. Wyjątek: utwórz takie wydarzenie tylko
wtedy, gdy użytkownik wprost o to poprosi (np. "dodaj 2h dojazdu do Warszawy").

Po każdym wywołaniu funkcji podsumuj konkretnie, co zmieniło się w kalendarzu —
podaj nazwę wydarzenia oraz dzień i godziny (np. "Dodałem: Algebra, wtorek
10:00–11:30"). Przy usuwaniu potwierdź, co dokładnie zostało usunięte.
"""

LOOP_EXHAUSTED_REPLY = (
    "Przepraszam, nie udało mi się dokończyć planowania w wyznaczonych "
    "krokach. Spróbujmy jeszcze raz."
)


@dataclass
class _StreamToolFunction:
    name: str
    arguments: str


class _StreamToolCall:
    def __init__(self, id: str, name: str, arguments: str):
        self.id = id
        self.function = _StreamToolFunction(name=name, arguments=arguments)


def _build_system_instruction() -> str:
    now = datetime.now(APP_TIMEZONE)
    return (
        f"{SYSTEM_INSTRUCTION.strip()}\n\n"
        f"Aktualna data i czas: {now:%Y-%m-%d %H:%M} "
        f"({APP_TIMEZONE.key}). Interpretuj określenia typu "
        '"dziś", "jutro", "w tym tygodniu" i nazwy dni tygodnia względem tej daty.'
    )


def _build_user_content(
    text: str, image_bytes: Optional[bytes], image_mime_type: Optional[str]
):
    """Multimodal user message: text + optional image as data URL."""
    if not image_bytes:
        return text or ""

    mime = image_mime_type or "image/jpeg"
    b64 = base64.b64encode(image_bytes).decode("ascii")
    parts = [
        {
            "type": "text",
            "text": IMAGE_SCHEDULE_INSTRUCTION.strip(),
        }
    ]
    if text:
        parts.append({"type": "text", "text": text})
    parts.append(
        {
            "type": "image_url",
            "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "high"},
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


def _prepare_messages(
    user_id: int,
    session_id: str,
    user_text: str,
    db: Session,
    image_bytes: Optional[bytes] = None,
    image_mime_type: Optional[str] = None,
):
    history_rows = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.session_id == session_id,
        )
        .order_by(ChatMessage.id)
        .all()
    )

    messages = [{"role": "system", "content": _build_system_instruction()}]
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

    return messages


def _append_tool_call_request(messages, msg, tool_calls):
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


def _append_tool_results(messages, tool_calls, db: Session, user_id: int):
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


def _store_assistant_reply(
    user_id: int,
    session_id: str,
    reply: str,
    db: Session,
):
    db.add(
        ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=reply,
        )
    )
    db.commit()


def _run_tool_loop(client: OpenAI, messages, db: Session, user_id: int):
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
            return msg.content or ""

        _append_tool_call_request(messages, msg, tool_calls)
        _append_tool_results(messages, tool_calls, db, user_id)

    return LOOP_EXHAUSTED_REPLY


def get_agent_response(
    user_id: int,
    session_id: str,
    user_text: str,
    db: Session,
    image_bytes: Optional[bytes] = None,
    image_mime_type: Optional[str] = None,
) -> str:
    messages = _prepare_messages(
        user_id, session_id, user_text, db, image_bytes, image_mime_type
    )
    client = OpenAI()

    reply = _run_tool_loop(client, messages, db, user_id)
    _store_assistant_reply(user_id, session_id, reply, db)

    return reply


def stream_agent_response(
    user_id: int,
    session_id: str,
    user_text: str,
    db: Session,
    image_bytes: Optional[bytes] = None,
    image_mime_type: Optional[str] = None,
) -> Iterator[str]:
    messages = _prepare_messages(
        user_id, session_id, user_text, db, image_bytes, image_mime_type
    )
    client = OpenAI()

    for _ in range(MAX_TOOL_ITERATIONS):
        stream = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=OPENAI_TOOLS,
            stream=True,
        )

        chunks = []
        tool_call_parts = {}
        for event in stream:
            if not event.choices:
                continue
            delta = event.choices[0].delta

            chunk = getattr(delta, "content", None)
            if chunk:
                chunks.append(chunk)
                yield chunk

            for tool_delta in getattr(delta, "tool_calls", None) or []:
                index = tool_delta.index
                current = tool_call_parts.setdefault(
                    index,
                    {"id": "", "name": "", "arguments": ""},
                )
                current["id"] += getattr(tool_delta, "id", None) or ""
                function = getattr(tool_delta, "function", None)
                if function:
                    current["name"] += getattr(function, "name", None) or ""
                    current["arguments"] += getattr(function, "arguments", None) or ""

        if not tool_call_parts:
            reply = "".join(chunks)
            _store_assistant_reply(user_id, session_id, reply, db)
            return

        tool_calls = []
        for index in sorted(tool_call_parts):
            part = tool_call_parts[index]
            tool_calls.append(
                _StreamToolCall(
                    id=part["id"],
                    name=part["name"],
                    arguments=part["arguments"],
                )
            )

        messages.append(
            {
                "role": "assistant",
                "content": "".join(chunks),
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
        _append_tool_results(messages, tool_calls, db, user_id)

    _store_assistant_reply(user_id, session_id, LOOP_EXHAUSTED_REPLY, db)
    yield LOOP_EXHAUSTED_REPLY
