import argparse
import sys
import yaml
from app.secflowcheck.client import parse_pipeline, analyze_pipeline
from app.secflowcheck.formatter import print_table, print_json

def run():
    parser = argparse.ArgumentParser(
        prog="secflowcheck",
        description="SecFlowCheck - CI/CD Security Analyzer"
    )

    parser.add_argument("file", help="Path to CI pipeline YAML file")
    parser.add_argument("--format", choices=["table", "json"], default="table")
    parser.add_argument("--fail-on-critical", action="store_true")

    args = parser.parse_args()

    try:
        with open(args.file, "r", encoding="utf-8") as f:
            yaml_text = f.read()
            yaml.safe_load(yaml_text)  # Validate YAML
    except Exception as e:
        print(f"Invalid YAML file: {e}")
        sys.exit(2)

    try:
        parsed = parse_pipeline(yaml_text)
        result = analyze_pipeline(parsed)
    except Exception as e:
        print(f"Failed to analyze pipeline: {e}")
        sys.exit(3)

    if args.format == "json":
        print_json(result)
    else:
        print_table(result)

    if args.fail_on_critical and result.get("score") == "E":
        print("Critical security issues detected")
        sys.exit(1)

    print("Analysis completed successfully")
    sys.exit(0)
