from authlib.integrations.starlette_client import OAuth
from app.config import settings

oauth = OAuth()

def init_extensions():
    # Register Google
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        oauth.register(
            name='google',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={
                'scope': 'openid email profile'
            }
        )

    # Register GitHub
    if settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET:
        oauth.register(
            name='github',
            client_id=settings.GITHUB_CLIENT_ID,
            client_secret=settings.GITHUB_CLIENT_SECRET,
            authorize_url='https://github.com/login/oauth/authorize',
            access_token_url='https://github.com/login/oauth/access_token',
            api_base_url='https://api.github.com/',
            client_kwargs={'scope': 'user:email'}
        )

    # Register GitLab (OAuth2 only, not OIDC)
    if settings.GITLAB_CLIENT_ID and settings.GITLAB_CLIENT_SECRET:
        oauth.register(
            name='gitlab',
            client_id=settings.GITLAB_CLIENT_ID,
            client_secret=settings.GITLAB_CLIENT_SECRET,
            authorize_url='https://gitlab.com/oauth/authorize',
            access_token_url='https://gitlab.com/oauth/token',
            api_base_url='https://gitlab.com/api/v4/',
            client_kwargs={'scope': 'read_user read_api'}
        )