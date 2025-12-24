from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict
import jwt 
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.user import User

# 1. Configuration for Password Hashing
# "bcrypt" is robust and standard for microservices
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against the stored hash.
    """
    if not hashed_password:
        return False
    truncated = plain_password[:72]
    return pwd_context.verify(truncated, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Generates a secure hash from a plain-text password.
    """
    truncated = password[:72]
    return pwd_context.hash(truncated)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a short-lived JWT Access Token.
    Contains user identity (sub) and roles.
    """
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add claims
    to_encode.update({
        "exp": expire,
        "type": "access",
        "iss": settings.APP_NAME  # Issuer claim for security
    })
    
    # Sign token
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Creates a long-lived JWT Refresh Token.
    Used to obtain new access tokens without re-login.
    """
    to_encode = data.copy()
    
    # Set expiration (usually days or weeks)
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Add claims
    to_encode.update({
        "exp": expire, 
        "type": "refresh",
        "iss": settings.APP_NAME
    })
    
    # Sign token
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

async def get_or_create_oauth_user(db: AsyncSession, email: str, full_name: str, provider: str, provider_id: str, oauth_token: str = None) -> User:
    """
    Retrieves a user by email, or creates a new one if not exists.
    Links the OAuth provider to the user and stores the OAuth access token.
    """
    # Check if user exists
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalars().first()

    if user:
        # Update provider info and token
        user.provider = provider
        user.provider_id = provider_id
        if oauth_token:
            user.oauth_token = oauth_token
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    # Create new user
    new_user = User(
        email=email,
        full_name=full_name,
        hashed_password=None, # OAuth users don't have password
        provider=provider,
        provider_id=provider_id,
        oauth_token=oauth_token,
        roles=["user"]
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user