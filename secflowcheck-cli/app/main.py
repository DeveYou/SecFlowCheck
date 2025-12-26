import typer
import requests
from pathlib import Path
from rich.console import Console
from rich.table import Table
from typing import Optional

from app.config import settings
from app.auth import save_token, load_token
from app.oauth_server import perform_oauth_login

app = typer.Typer(help="SecFlowCheck CLI – CI/CD security scanner")
console = Console()

SEVERITY_ORDER = {
    "CRITICAL": 5,
    "HIGH": 4,
    "MEDIUM": 3,
    "LOW": 2,
    "INFO": 1
}

@app.callback()
def callback():
    """
    SecFlowCheck CLI entry point.
    """

def login_with_password():
    """Handles standard username/password login."""
    email = typer.prompt("Email")
    password = typer.prompt("Password", hide_input=True)

    try:
        with console.status("[bold green]Authenticating..."):
            response = requests.post(
                f"{settings.GATEWAY_URL}/auth/login",
                json={"email": email, "password": password},
                timeout=10,
            )

        if response.status_code != 200:
            console.print("[red]Invalid credentials[/red]")
            raise typer.Exit(code=1)

        data = response.json()
        token = data.get("access_token")
        expires_in = data.get("expires_in", 3600)

        if not token:
            console.print("[red]No token received from auth service[/red]")
            raise typer.Exit(code=1)

        save_token(token, expires_in)
        console.print("[bold green]Login successful! Token saved.[/bold green]")

    except requests.RequestException as e:
        console.print(f"[red]Auth service unreachable:[/red] {e}")
        raise typer.Exit(code=1)

def login_with_oauth(provider: str):
    """Handles OAuth flow (Google, GitHub, GitLab)."""
    
    # Construct the URL that the Auth Service expects
    # The '?cli=true' param tells backend to redirect to localhost:8765/callback
    auth_url = f"{settings.GATEWAY_URL}/auth/login/oauth/{provider}?cli=true"
    
    token = perform_oauth_login(auth_url)
    
    if token:
        # We assume standard 1 hour expiration for OAuth flows unless decoded
        save_token(token, 3600) 
        console.print("[bold green]OAuth Login successful! Token saved.[/bold green]")
    else:
        console.print("[red]Failed to capture token.[/red]")
        raise typer.Exit(code=1)

@app.command("login")
def login(
    provider: str = typer.Option(
        "password", 
        "--provider", "-p", 
        help="Authentication method: password, google, github, gitlab"
    ),
):
    """
    Authenticate with SecFlowCheck.
    Default is password. Use --provider for OAuth.
    """
    provider = provider.lower()
    
    if provider == "password":
        login_with_password()
    elif provider in ["google", "github", "gitlab"]:
        login_with_oauth(provider)
    else:
        console.print(f"[red]Unknown provider: {provider}[/red]")
        console.print("Supported: password, google, github, gitlab")
        raise typer.Exit(code=1)


@app.command("scan")
def scan(
    file_path: str = typer.Argument(..., help="Path to CI/CD YAML file"),
    fail_on: str = typer.Option(
        "high",
        "--fail-on",
        help="Fail if risk is >= this level (info|low|medium|high|critical)"
    ),
    format: str = typer.Option(
        "text",
        "--format",
        help="Output format (text|json)"
    ),
):
    """
    Scan a CI/CD pipeline file for security vulnerabilities.
    """
    token = load_token()
    if not token:
        console.print("[red]You are not logged in. Run `secflowcheck login` first.[/red]")
        raise typer.Exit(code=1)

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    path = Path(file_path)
    if not path.exists():
        console.print(f"[red]File not found:[/red] {file_path}")
        raise typer.Exit(code=2)

    content = path.read_text(encoding="utf-8")

    console.print("[blue]Analyzing pipeline structure...[/blue]")

    try:
        # Parse Step
        parsed = requests.post(
            f"{settings.PARSER_API_URL}/parse",
            json={"content": content, "filename": file_path},
            headers=headers,
            timeout=10
        )
        parsed.raise_for_status()
        parsed_data = parsed.json()

        console.print("[blue]Running security analysis...[/blue]")

        # Analyze Step
        result = requests.post(
            f"{settings.ANALYZER_API_URL}/analyze",
            json=parsed_data,
            headers=headers,
            timeout=30 # Analysis might take longer
        )
        result.raise_for_status()
        result_data = result.json()

    except requests.RequestException as e:
        console.print(f"[red]Service Communication Error:[/red] {e}")
        raise typer.Exit(code=2)

    risk = result_data.get("score", "UNKNOWN")
    grade = result_data.get("grade", "-")
    findings = result_data.get("findings", [])

    # ---- JSON OUTPUT (CI MODE)
    if format == "json":
        console.print_json(data=result_data)
        # Calculate exit code silently
        exit_code = 1 if SEVERITY_ORDER.get(risk, 0) >= SEVERITY_ORDER.get(fail_on.upper(), 0) else 0
        raise typer.Exit(code=exit_code)

    # ---- TEXT OUTPUT
    console.print(f"\n[bold]Scan Result: {file_path}[/bold]")
    console.print(f"Risk Score: [bold]{risk}[/bold] (Grade {grade})")

    if findings:
        table = Table(title="Security Findings")
        table.add_column("Severity", style="red")
        table.add_column("Message")
        table.add_column("Location", style="dim")

        for f in findings:
            table.add_row(
                f.get("severity", "INFO"),
                f.get("description", ""),
                str(f.get("location", "Unknown"))
            )

        console.print(table)
    else:
        console.print("[green]No findings detected[/green]")

    fail_level = SEVERITY_ORDER.get(fail_on.upper(), 4)
    detected_level = SEVERITY_ORDER.get(risk, 0)

    if detected_level >= fail_level:
        console.print("\n[bold red]Pipeline security check FAILED[/bold red]")
        raise typer.Exit(code=1)

    console.print("\n[bold green]Pipeline security check PASSED[/bold green]")
    raise typer.Exit(code=0)


def main():
    app()

if __name__ == "__main__":
    main()