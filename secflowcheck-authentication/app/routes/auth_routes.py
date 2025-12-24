from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt
import json
import base64

from app.database import get_db
from app.models.user import User, UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token, 
    get_or_create_oauth_user
)
from app.config import settings
from app.extensions import oauth

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

@router.get("/login/oauth/{provider}")
async def login_oauth(provider: str, request: Request, cli: bool = False):
    """
    Initiates OAuth2 login flow.
    """
    # Validate Provider
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=404, detail=f"Provider {provider} not found")
    
    # Construct Redirect URI 
    # (MUST match exactly what you registered in Google/GitHub console)
    # Using request.url_for is risky behind a Gateway. Better to use strict config:
    redirect_uri = f"{settings.GATEWAY_URL}/auth/callback/{provider}"

    # Create 'State' to remember if this is a CLI request
    # We encode it to base64 or simple JSON string to pass through the provider
    state_data = {"is_cli": cli}
    state_str = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()

    # Redirect to Provider with State
    return await client.authorize_redirect(request, redirect_uri, state=state_str)


@router.get("/callback/{provider}", name="auth_callback")
async def auth_callback(
    provider: str, 
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    """
    Callback for OAuth2 providers.
    """
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    try:
        # Exchange code for token
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

    # Extract user details (Normalize GitHub/GitLab/Google)
    email = user_info.get('email')
    
    # Fallback for GitHub (if email is private)
    if not email and provider == "github":
        email = f"{user_info.get('login')}@github.placeholder.com"

    name = user_info.get('name') or user_info.get('login') or "Unknown User"
    provider_id = str(user_info.get('sub') or user_info.get('id'))
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by OAuth provider")

    # Extract OAuth access token for API calls
    oauth_access_token = token.get('access_token')

    # Get or create user (store OAuth token for repo API access)
    user = await get_or_create_oauth_user(db, email, name, provider, provider_id, oauth_access_token)
    

    # Generate YOUR Security JWT
    access_token = create_access_token(data={"sub": user.email, "roles": user.roles})
    
    # Check 'State' to determine redirection target
    is_cli = False
    state = request.query_params.get("state")
    
    if state:
        try:
            # Decode the state we sent earlier
            decoded_state = json.loads(base64.urlsafe_b64decode(state).decode())
            is_cli = decoded_state.get("is_cli", False)
        except Exception:
            pass # If state is invalid, default to False

    # Redirect to appropriate destination
    if is_cli:
        # Redirect to the local CLI server
        target_url = f"http://localhost:8765/callback?token={access_token}"
    else:
        # Redirect to the Frontend Dashboard
        target_url = f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"

    return RedirectResponse(url=target_url)