from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt

from app.database import get_db
from app.models.user import User, UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import verify_password, get_password_hash, create_access_token, create_refresh_token, get_or_create_oauth_user
from app.config import settings

router = APIRouter(tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        roles=["user"]
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate tokens
    #access_token = create_access_token(data={"sub": new_user.email, "roles": new_user.roles})
    #refresh_token = create_refresh_token(data={"sub": new_user.email})
    
    return new_user

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Find user
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    access_token = create_access_token(data={"sub": user.email, "roles": user.roles})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        user = result.scalars().first()
        
        if not user:
             raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# --- OAuth Routes ---
from fastapi import Request
from fastapi.responses import RedirectResponse
from app.extensions import oauth

@router.get("/login/{provider}")
async def login_oauth(provider: str, request: Request):
    """
    Initiates OAuth2 login flow.
    """
    # Ensure provider is valid
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=404, detail=f"Provider {provider} not found")
    
    # Use external Gateway URL for redirect (not internal Docker URL)
    redirect_uri = f"http://localhost:8080/auth/callback/{provider}"
    return await client.authorize_redirect(request, redirect_uri)

@router.get("/callback/{provider}", name="auth_callback")
async def auth_callback(provider: str, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Callback for OAuth2 providers.
    """
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    try:
        token = await client.authorize_access_token(request)
        
        # Handle different providers
        if provider == 'google':
            user_info = token.get('userinfo')
            if not user_info:
                user_info = await client.userinfo(token=token)
            email = user_info.get('email')
            name = user_info.get('name', 'Unknown')
            provider_id = str(user_info.get('sub'))
            
        elif provider == 'github':
            # GitHub requires separate API call
            resp = await client.get('user', token=token)
            user_info = resp.json()
            
            # GitHub may not return email in profile, need separate call
            email = user_info.get('email')
            if not email:
                emails_resp = await client.get('user/emails', token=token)
                emails = emails_resp.json()
                primary_email = next((e for e in emails if e.get('primary')), None)
                email = primary_email.get('email') if primary_email else None
            
            name = user_info.get('name') or user_info.get('login', 'Unknown')
            provider_id = str(user_info.get('id'))
            
        elif provider == 'gitlab':
            # GitLab requires separate API call
            resp = await client.get('user', token=token)
            user_info = resp.json()
            email = user_info.get('email')
            name = user_info.get('name', 'Unknown')
            provider_id = str(user_info.get('id'))
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"OAuth Handshake Failed: {str(e)}")

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by OAuth provider")

    # Get or create user
    user = await get_or_create_oauth_user(db, email, name, provider, provider_id)

    # Generate JWT
    access_token = create_access_token(data={"sub": user.email, "roles": user.roles})
    
    # Redirect to frontend with token
    response = RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}")
    return response