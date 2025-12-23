import typer
import requests
from pathlib import Path
from rich.console import Console
from rich.table import Table
from app.config import settings

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

    path = Path(file_path)
    if not path.exists():
        console.print(f"[red]File not found:[/red] {file_path}")
        raise typer.Exit(code=2)

    content = path.read_text(encoding="utf-8")

    console.print("[blue]Analyzing pipeline structure...[/blue]")

    try:
        parsed = requests.post(
            f"{settings.PARSER_API_URL}/parse",
            json={"content": content, "filename": file_path}
        ).json()
    except Exception as e:
        console.print(f"[red]Parser service error:[/red] {e}")
        raise typer.Exit(code=2)

    console.print("[blue]Running security analysis...[/blue]")

    try:
        result = requests.post(
            f"{settings.ANALYZER_API_URL}/analyze",
            json=parsed
        ).json()
    except Exception as e:
        console.print(f"[red]Analyzer service error:[/red] {e}")
        raise typer.Exit(code=2)

    risk = result.get("risk_score", "UNKNOWN")
    grade = result.get("grade", "-")
    findings = result.get("findings", [])

    # ---- JSON OUTPUT (CI MODE)
    if format == "json":
        console.print_json(data=result)
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
                f.get("message", ""),
                f.get("location", "Unknown")
            )

        console.print(table)
    else:
        console.print("[green]No findings detected[/green]")

    fail_level = SEVERITY_ORDER.get(fail_on.upper(), 4)
    detected_level = SEVERITY_ORDER.get(risk, 0)

    if detected_level >= fail_level:
        console.print("\n[red]Pipeline security check FAILED[/red]")
        raise typer.Exit(code=1)

    console.print("\n[green]Pipeline security check PASSED[/green]")
    raise typer.Exit(code=0)


def main():
    app()


if __name__ == "__main__":
    main()
