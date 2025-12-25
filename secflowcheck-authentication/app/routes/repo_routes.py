"""
Repository Routes - Access GitHub/GitLab repositories via stored OAuth tokens
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import jwt

from app.database import get_db
from app.models.user import User
from app.config import settings

router = APIRouter(tags=["Repositories"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


import logging

logger = logging.getLogger("uvicorn.error")

async def get_current_user_with_token(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """Get current user with their OAuth token"""
    try:
        logger.warning(f"DEBUG AUTH: Processing token request. Token prefix={token[:10]}...")
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except Exception as decode_err:
            logger.warning(f"DEBUG AUTH: Decode failed: {decode_err}. Secret Key len: {len(settings.SECRET_KEY)}")
            raise decode_err
            
        email = payload.get("sub")
        logger.warning(f"DEBUG AUTH: Decoded email={email}")

        if not email:
            logger.warning("DEBUG AUTH: No email in token payload")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        user = result.scalars().first()
        
        if not user:
            logger.warning(f"DEBUG AUTH: User {email} not found in database")
            raise HTTPException(status_code=401, detail="User not found")
        
        logger.warning(f"DEBUG AUTH: User verified: {user.email}, Provider: {user.provider}")
        return user
    except jwt.ExpiredSignatureError:
        logger.warning("DEBUG AUTH: Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError as e:
        logger.warning(f"DEBUG AUTH: JWT Validation Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        logger.warning(f"DEBUG AUTH: Unexpected error in auth dep: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")


@router.get("/")
async def list_repositories(user: User = Depends(get_current_user_with_token)):
    """List user's repositories from GitHub or GitLab"""
    try:
        if user.provider not in ['github', 'gitlab']:
            raise HTTPException(status_code=400, detail="Repository access only available for GitHub/GitLab users")
        
        if not user.oauth_token:
            raise HTTPException(status_code=400, detail="No OAuth token available. Please re-login with GitHub/GitLab")
        
        async with httpx.AsyncClient() as client:
            if user.provider == 'github':
                response = await client.get(
                    "https://api.github.com/user/repos",
                    headers={
                        "Authorization": f"Bearer {user.oauth_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    params={
                        "per_page": 100, 
                        "sort": "updated",
                        "type": "public" 
                    }
                )
                
                # Debug Scopes and Response
                logger.warning(f"DEBUG GITHUB: Scopes: {response.headers.get('X-OAuth-Scopes')}")
            else:  # gitlab
                response = await client.get(
                    "https://gitlab.com/api/v4/projects",
                    headers={"Authorization": f"Bearer {user.oauth_token}"},
                    params={"membership": "true", "per_page": 100, "order_by": "last_activity_at"}
                )
            
            if response.status_code != 200:
                logger.error(f"Repo fetch error: {response.text}") 
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch repositories: {response.text}")
            
            repos = response.json()
            logger.warning(f"DEBUG GITHUB: Fetched {len(repos)} repositories raw.")
            
            # Normalize response format
            if user.provider == 'github':
                return [{"id": r["id"], "name": r["name"], "full_name": r["full_name"], "default_branch": r["default_branch"]} for r in repos]
            else:  # gitlab
                return [{"id": r["id"], "name": r["name"], "full_name": r["path_with_namespace"], "default_branch": r.get("default_branch", "main")} for r in repos]
                
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/{owner}/{repo}/contents")
async def list_repo_contents(
    owner: str, 
    repo: str, 
    path: str = "",
    user: User = Depends(get_current_user_with_token)
):
    """List contents of a repository directory, filtering for YAML files"""
    
    if user.provider not in ['github', 'gitlab']:
        raise HTTPException(status_code=400, detail="Repository access only available for GitHub/GitLab users")
    
    if not user.oauth_token:
        raise HTTPException(status_code=400, detail="No OAuth token available")
    
    async with httpx.AsyncClient() as client:
        if user.provider == 'github':
            url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
            response = await client.get(
                url,
                headers={
                    "Authorization": f"Bearer {user.oauth_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
        else:  # gitlab
            # GitLab uses project ID or URL-encoded path
            project_path = f"{owner}/{repo}".replace("/", "%2F")
            encoded_path = path.replace("/", "%2F") if path else ""
            url = f"https://gitlab.com/api/v4/projects/{project_path}/repository/tree"
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {user.oauth_token}"},
                params={"path": path, "per_page": 100}
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch repository contents")
        
        contents = response.json()
        
        # Filter and normalize
        result = []
        for item in contents if isinstance(contents, list) else [contents]:
            if user.provider == 'github':
                name = item.get("name", "")
                item_type = item.get("type", "")
                item_path = item.get("path", "")
            else:  # gitlab
                name = item.get("name", "")
                item_type = "dir" if item.get("type") == "tree" else "file"
                item_path = item.get("path", "")
            
            # Include directories and YAML files
            if item_type == "dir" or name.endswith(('.yml', '.yaml')):
                result.append({
                    "name": name,
                    "type": item_type,
                    "path": item_path
                })
        
        return result


@router.get("/{owner}/{repo}/file/{file_path:path}")
async def get_file_content(
    owner: str,
    repo: str,
    file_path: str,
    user: User = Depends(get_current_user_with_token)
):
    """Get content of a specific file from repository"""
    
    if user.provider not in ['github', 'gitlab']:
        raise HTTPException(status_code=400, detail="Repository access only available for GitHub/GitLab users")
    
    if not user.oauth_token:
        raise HTTPException(status_code=400, detail="No OAuth token available")
    
    async with httpx.AsyncClient() as client:
        if user.provider == 'github':
            url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
            response = await client.get(
                url,
                headers={
                    "Authorization": f"Bearer {user.oauth_token}",
                    "Accept": "application/vnd.github.v3.raw"  # Get raw content
                }
            )
        else:  # gitlab
            project_path = f"{owner}/{repo}".replace("/", "%2F")
            encoded_file = file_path.replace("/", "%2F")
            url = f"https://gitlab.com/api/v4/projects/{project_path}/repository/files/{encoded_file}/raw"
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {user.oauth_token}"},
                params={"ref": "main"}  # Default branch
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch file content")
        
        return {"content": response.text, "path": file_path}
