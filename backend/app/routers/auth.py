from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db

from google.oauth2 import id_token
from google.auth.transport import requests
import os, uuid

from app.schemas.user import UserCreate, UserLogin, GoogleToken
from app.services.auth_service import create_user, authenticate_user
from app.core.security import create_access_token
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
    }


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user.email, user.password)


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user.email, user.password)

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"user_id": db_user.id})

    return {"access_token": token, "token_type": "bearer"}


@router.post("/google-login")
async def google_login(token_data: GoogleToken, db: Session = Depends(get_db)):
    try:
        # Weryfikacja tokenu Google
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(
            token_data.credential, requests.Request(), client_id
        )

        email = idinfo.get("email")

        user = db.query(User).filter(User.email == email).first()

        if not user:

            random_password = f"google_oauth_{uuid.uuid4()}"

            new_user = User(email=email, password=random_password)

            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user

        access_token = create_access_token(data={"user_id": user.id})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": "Pomyślnie zalogowano przez Google",
        }

    except ValueError:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token Google")
