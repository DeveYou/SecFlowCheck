from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, EmailStr

from app.database import Base

# --- Pydantic Schemas (For Request/Response) ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    roles: List[str]
    is_active: bool
    provider: str = "local"  # Expose auth provider (local, github, gitlab, google)
    created_at: datetime

    class Config:
        from_attributes = True # Allows Pydantic to read ORM objects

# --- SQLAlchemy ORM Model (For Database) ---
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    roles: Mapped[List[str]] = mapped_column(JSON, default=["user"])
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    provider: Mapped[str] = mapped_column(String, default="local")
    provider_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    oauth_token: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)  # Store OAuth access token
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)