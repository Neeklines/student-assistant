from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_agent import get_agent_response
from app.database import get_db

router = APIRouter(prefix="/chat", tags=["Chat AI"])

@router.post("/", response_model=ChatResponse)
async def chat_with_ai(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        reply = get_agent_response(req.session_id, req.message, db)
        return ChatResponse(response=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))