from rich.console import Console
from rich.table import Table
import json

console = Console()

def print_table(result: dict):
    table = Table(title="SecFlowCheck Analysis Result")

    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Pipeline Type", result.get("pipeline_type", "Unknown"))
    table.add_row("Score", result.get("score"))
    table.add_row("Total Findings", str(result.get("total_findings")))

    console.print(table)

    if result.get("findings"):
        findings = Table(title="Findings")
        findings.add_column("Rule ID", style="red")
        findings.add_column("Severity", style="yellow")
        findings.add_column("Description", style="white")

        for f in result["findings"]:
            findings.add_row(
                f["rule_id"],
                f["severity"],
                f["description"]
            )

        console.print(findings)

def print_json(result: dict):
    print(json.dumps(result, indent=2))
