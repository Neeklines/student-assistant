from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from sqlalchemy.orm import Session

from app.schemas.chat import ChatResponse
from app.services.ai_agent import get_agent_response
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Chat AI"])


@router.post("/", response_model=ChatResponse)
async def chat_with_ai(
    session_id: str = Form(...),
    message: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_bytes = None
    image_mime_type = None
    if image and image.filename:
        image_bytes = await image.read()
        image_mime_type = image.content_type

    try:
        reply = get_agent_response(
            current_user.id, session_id, message, db, image_bytes, image_mime_type
        )
        return ChatResponse(response=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
