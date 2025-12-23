# SecFlowCheck Parser Service

A FastAPI-based microservice that parses CI/CD pipeline configuration files (YAML) and extracts security-relevant features and findings for vulnerability analysis.

## Overview

The Parser Service is responsible for:
- Parsing YAML-based CI/CD pipeline files (GitHub Actions, GitLab CI, Jenkins, etc.)
- Extracting structural features (jobs, steps, workflows)
- Detecting potential security issues (secrets, privileged access)
- Generating findings with severity levels
- Producing feature vectors for ML-based analysis

## Features

- 🔍 **Multi-Platform Support**: GitHub Actions, GitLab CI, and generic YAML pipelines
- 🔐 **Secret Detection**: Identifies hardcoded secrets, tokens, passwords, and API keys
- ⚠️ **Permission Analysis**: Detects privileged access patterns (sudo, docker.sock, admin)
- 📊 **Feature Extraction**: Generates numerical feature vectors for ML models
- 🎯 **Finding Reports**: Provides detailed security findings with locations and severity

## Architecture

### Components

- **ParserService**: Core parsing logic and feature extraction
- **Schemas**: Pydantic models for request/response validation
- **Health Check**: Service status endpoint for monitoring

### API Endpoints

#### POST `/parse`
Parse a CI/CD pipeline file and extract features.

**Request Body:**
```json
{
  "content": "name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v2",
  "filename": "ci.yml"
}
```

**Response:**
```json
{
  "filename": "ci.yml",
  "content": { ... },
  "features": {
    "num_jobs": 1,
    "num_steps": 1,
    "has_secrets": 0,
    "privileged_access": 0
  },
  "findings": []
}
```

#### GET `/health`
Check service health status.

**Response:**
```json
{
  "status": "ok"
}
```

## Installation

### Prerequisites

- Python 3.8+
- pip package manager

### Local Development

1. **Navigate to the service directory:**
   ```bash
   cd secflowcheck-parser
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the service:**
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

### Docker Deployment

```bash
docker build -t secflowcheck-parser .
docker run -p 8001:8000 secflowcheck-parser
```

## Configuration

The service is stateless and requires no environment variables for basic operation.

## Detection Capabilities

### Secret Detection

The service identifies potential secrets using pattern matching:

- **Keywords**: password, secret, token, key, api_key, access_key
- **Patterns**: Detects assignment patterns like `API_KEY=abc123`
- **Severity**: CRITICAL

**Example:**
```yaml
env:
  API_KEY: "super_secret_123"  # ⚠️ CRITICAL: Potential secret in key 'API_KEY'
```

### Privileged Access Detection

Identifies dangerous permission patterns:

- **Keywords**: write-all, admin, sudo, privileged, docker.sock
- **Severity**: HIGH

**Example:**
```yaml
script:
  - sudo apt-get install  # ⚠️ HIGH: Privileged access detected
```

## Feature Extraction

The service generates a feature vector for ML analysis:

| Feature | Description | Type |
|---------|-------------|------|
| `num_jobs` | Number of jobs in the pipeline | Integer |
| `num_steps` | Total number of steps across all jobs | Integer |
| `has_secrets` | Whether secrets were detected | Binary (0/1) |
| `privileged_access` | Whether privileged access was detected | Binary (0/1) |

## API Testing

### Using cURL

```bash
curl -X POST http://localhost:8001/parse \
  -H "Content-Type: application/json" \
  -d '{
    "content": "name: CI\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hello",
    "filename": "test.yml"
  }'
```

### Using Python

```python
import requests

response = requests.post(
    "http://localhost:8001/parse",
    json={
        "content": "name: CI\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest",
        "filename": "ci.yml"
    }
)
print(response.json())
```

## Integration with Other Services

The Parser Service is typically called by:

1. **CLI**: The `secflowcheck-cli` uses this service to analyze pipeline files
2. **Report Service**: Can integrate for batch analysis
3. **Custom Tools**: Any tool needing pipeline analysis

## Error Handling

| Error Type | Status Code | Description |
|------------|-------------|-------------|
| Invalid YAML | 400 | The provided content is not valid YAML |
| Missing fields | 422 | Request body missing required fields |
| Service error | 500 | Internal server error |

## Development

### Project Structure

```
secflowcheck-parser/
├── app/
│   ├── main.py              # FastAPI application
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   └── services/
│       └── parser_service.py # Core parsing logic
├── Dockerfile
├── requirements.txt
└── README.md
```

### Running Tests

```bash
pytest tests/
```

## Health Monitoring

Check service health:
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{"status": "ok"}
```

## Troubleshooting

### Service won't start
- Ensure port 8001 is not in use
- Verify Python version is 3.8+
- Check all dependencies are installed

### Invalid YAML errors
- Ensure the content is valid YAML syntax
- Check for proper indentation
- Validate YAML using online validators first

### No findings detected
- The parser may not find issues in secure pipelines
- Check that the YAML structure matches expected formats (GitHub/GitLab)
- Review secret/permission patterns in `parser_service.py`

## Contributing

When adding new detection patterns:
1. Update regex patterns in `ParserService`
2. Add corresponding tests
3. Update this README with new capabilities

## License

Part of the SecFlowCheck project.
