# SecFlowCheck CLI

A command-line interface for scanning CI/CD pipeline files for security vulnerabilities. This tool integrates with the SecFlowCheck Parser and Analyzer services to provide automated security analysis of your pipeline configurations.

## Features

- 🔍 Scan CI/CD pipeline files (GitHub Actions, GitLab CI, Jenkins, etc.)
- 🎯 Get real-time security risk scores and grades
- 🚨 Identify specific security findings with severity levels
- ✅ Exit codes compatible with CI/CD integration
- 🎨 Colored output for better readability

## Prerequisites

- Python 3.8 or higher
- Access to SecFlowCheck Parser and Analyzer services
- `pip` package manager

## Installation

1. **Clone or navigate to the CLI directory:**
   ```bash
   cd secflowcheck-cli
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   PARSER_API_URL=http://localhost:8001
   ANALYZER_API_URL=http://localhost:8002
   ```
   
   Adjust the URLs to match your service endpoints. If running via Docker Compose, these should point to the service names.

## Usage

### Basic Scan Command

```bash
secflowcheck scan <path-to-pipeline-file>
```

### Examples

**Scan a GitHub Actions workflow:**
```bash
secflowcheck scan .github/workflows/ci.yml
```

**Scan a GitLab CI configuration:**
```bash
secflowcheck scan .gitlab-ci.yml
```

**Scan a Jenkins pipeline:**
```bash
secflowcheck scan Jenkinsfile
```

### Understanding the Output

The CLI provides structured output with the following information:

```
Analyzing structure...
Predicting risk...

Scan Complete for .github/workflows/ci.yml
Risk Score: HIGH (Grade: C)

Findings:
  [CRITICAL] Hardcoded secret detected in environment variable (at step: deploy)
  [HIGH] Insecure checkout without commit SHA pinning (at step: checkout)
  [MEDIUM] Third-party action used without version pinning (at step: setup)

Pipeline security check FAILED.
```

#### Risk Levels

- **LOW** (Green): Minimal security issues detected
- **MEDIUM** (Yellow): Some security concerns identified
- **HIGH** (Red): Significant security risks found
- **CRITICAL** (Red): Severe security vulnerabilities detected

#### Exit Codes

- `0`: Success - Pipeline passed security checks (LOW or MEDIUM risk)
- `1`: Failure - Pipeline failed security checks (HIGH or CRITICAL risk)
- `2`: Error - Tool encountered an error (file not found, service unavailable, etc.)

### CI/CD Integration

You can integrate this CLI into your CI/CD pipelines to automatically check for security issues:

**GitHub Actions example:**
```yaml
- name: Security Scan
  run: |
    pip install -r secflowcheck-cli/requirements.txt
    python secflowcheck-cli/app/main.py scan .github/workflows/ci.yml
```

**GitLab CI example:**
```yaml
security_scan:
  stage: test
  script:
    - pip install -r secflowcheck-cli/requirements.txt
    - python secflowcheck-cli/app/main.py scan .gitlab-ci.yml
```

The pipeline will fail automatically if HIGH or CRITICAL risks are detected.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PARSER_API_URL` | URL of the Parser Service | `http://localhost:8001` |
| `ANALYZER_API_URL` | URL of the Analyzer Service | `http://localhost:8002` |

### Service Dependencies

The CLI requires both services to be running:

1. **Parser Service**: Analyzes and parses pipeline file structure
2. **Analyzer Service**: Uses ML models to predict security risks

**Start services using Docker Compose:**
```bash
docker-compose up parser analyzer
```

## Troubleshooting

### "Could not connect to Parser Service"
- Ensure the Parser service is running
- Verify `PARSER_API_URL` in `.env` is correct
- Check network connectivity between CLI and service

### "Could not connect to Analyzer Service"
- Ensure the Analyzer service is running
- Verify `ANALYZER_API_URL` in `.env` is correct
- Check that the ML model is properly loaded

### "File not found" error
- Verify the file path is correct
- Use absolute paths if relative paths don't work
- Ensure the file exists and is readable

## Development

### Running in Development Mode

```bash
secflowcheck scan <path-to-file>
```

### Adding New Commands

The CLI uses [Typer](https://typer.tiangolo.com/) for command-line interface management. To add new commands, edit `app/main.py`:

```python
@app.command()
def my_command():
    """Your command description."""
    # Command logic here
```

## License

Part of the SecFlowCheck project. See parent repository for license information.
