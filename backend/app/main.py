from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import health, auth, meta, calendar, chat


app = FastAPI()

# CORS configuration to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://neeklines.xyz"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(meta.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
