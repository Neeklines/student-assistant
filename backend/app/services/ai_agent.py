import os
from sqlalchemy.orm import Session
from app.models.chat import ChatMessage
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# initialization
client = genai.Client()

SYSTEM_INSTRUCTION = """
Jesteś osobistym asystentem studenta ds. produktywności i układania planu dnia.
Pomagaj ustalać realistyczny harmonogram, uwzględniaj przerwy na jedzenie, sen i odpoczynek.
Bądź motywujący i wspierający.
"""

def get_agent_response(session_id: str, user_text: str, db: Session) -> str:
    # getting history from db
    db_messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.id).all()
    
    formatted_history = []
    for msg in db_messages:
        formatted_history.append(
            types.Content(
                role=msg.role, 
                parts=[types.Part.from_text(text=msg.content)]
            )
        )
        
    # saving of req
    new_user_msg = ChatMessage(session_id=session_id, role="user", content=user_text)
    db.add(new_user_msg)
    db.commit()

    chat = client.chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
        ),
        history=formatted_history
    )
    
    # message sending
    response = chat.send_message(user_text)
    
    # saving of response
    new_agent_msg = ChatMessage(session_id=session_id, role="model", content=response.text)
    db.add(new_agent_msg)
    db.commit()
    
    return response.text