# SecFlowCheck Analyzer Service

A FastAPI-based microservice that uses machine learning to analyze parsed CI/CD pipelines and predict security risk scores. The service integrates with Celery for asynchronous task processing and Eureka for service discovery.

## Overview

The Analyzer Service is responsible for:
- Loading and managing ML models for security risk prediction
- Analyzing parsed pipeline features to generate risk scores
- Classifying pipelines into risk categories (LOW, MEDIUM, HIGH, CRITICAL)
- Assigning security grades (A-F)
- Processing analysis tasks asynchronously via Celery
- Registering with Eureka for service discovery

## Features

- 🤖 **ML-Powered Analysis**: Uses trained models to predict security risks
- ⚡ **Async Processing**: Celery integration for background task execution
- 🔍 **Risk Classification**: Categorizes pipelines by risk level
- 📊 **Grade Assignment**: Provides letter grades (A-F) for security posture
- 🌐 **Service Discovery**: Eureka integration for microservice architecture
- 📈 **Scalable**: Distributed task processing with Celery workers

## Architecture

### Components

- **FastAPI Application**: REST API for analysis requests
- **ML Model Loader**: Loads and manages the trained security model
- **Celery Worker**: Processes analysis tasks asynchronously
- **Eureka Client**: Registers service with discovery server

### Dependencies

- **Parser Service**: Provides parsed pipeline data
- **Report Service**: Stores analysis results
- **Redis/RabbitMQ**: Celery message broker
- **Eureka Discovery**: Service registration and discovery

## Installation

### Prerequisites

- Python 3.8+
- Redis or RabbitMQ (for Celery)
- Trained ML model file
- Access to Eureka Discovery service

### Local Development

1. **Navigate to the service directory:**
   ```bash
   cd secflowcheck-analyzer
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   
   Create a `.env` file:
   ```env
   DEBUG=True
   CELERY_BROKER=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/0
   REPORT_API_URL=http://localhost:8004
   REPORT_JWT=your_jwt_token
   SECFLOWCHECK_MODEL_PATH=/path/to/model.pkl
   EUREKA_SERVER=http://localhost:8761/eureka
   ```

5. **Start the FastAPI service:**
   ```bash
   uvicorn app.main:app --reload --port 8003
   ```

6. **Start Celery worker (in another terminal):**
   ```bash
   celery -A app.tasks.celery worker --loglevel=info
   ```

### Docker Deployment

```bash
docker build -t secflowcheck-analyzer .
docker run -p 8003:8000 --env-file .env secflowcheck-analyzer
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DEBUG` | Enable debug mode | Yes | - |
| `CELERY_BROKER` | Celery message broker URL | Yes | - |
| `CELERY_RESULT_BACKEND` | Celery result backend URL | Yes | - |
| `REPORT_API_URL` | Report service URL | Yes | - |
| `REPORT_JWT` | JWT token for Report service auth | Yes | - |
| `SECFLOWCHECK_MODEL_PATH` | Path to trained ML model | Yes | - |
| `EUREKA_SERVER` | Eureka discovery server URL | No | `http://discovery:8761/eureka` |
| `SERVICE_PORT` | Service port number | No | `8003` |
| `INSTANCE_IP` | Instance hostname/IP | No | `secflowcheck-analyzer` |

## API Endpoints

### POST `/analyze`

Analyze a parsed pipeline and generate risk assessment.

**Request Body:**
```json
{
  "filename": "ci.yml",
  "content": { ... },
  "features": {
    "num_jobs": 3,
    "num_steps": 10,
    "has_secrets": 1,
    "privileged_access": 1
  },
  "findings": [
    {
      "type": "secret",
      "message": "Hardcoded secret detected",
      "location": "jobs.build.env.API_KEY",
      "severity": "CRITICAL"
    }
  ]
}
```

**Response:**
```json
{
  "risk_score": "HIGH",
  "grade": "D",
  "findings": [
    {
      "type": "secret",
      "message": "Hardcoded secret detected",
      "location": "jobs.build.env.API_KEY",
      "severity": "CRITICAL"
    }
  ],
  "confidence": 0.87,
  "recommendations": [
    "Remove hardcoded secrets",
    "Use secure secret management"
  ]
}
```

### GET `/health`

Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### GET `/`

Service information endpoint.

**Response:**
```json
{
  "message": "analyzer-service is running!"
}
```

## Risk Classification

### Risk Levels

The ML model predicts one of four risk levels:

| Risk Level | Description | Grade Range | Action |
|------------|-------------|-------------|--------|
| **LOW** | Minimal security concerns | A-B | Monitor |
| **MEDIUM** | Some security issues detected | C | Review and address |
| **HIGH** | Significant security risks | D | Immediate attention required |
| **CRITICAL** | Severe security vulnerabilities | F | Block deployment |

### Grade Mapping

- **A**: Excellent security posture (90-100%)
- **B**: Good security with minor issues (80-89%)
- **C**: Acceptable but needs improvement (70-79%)
- **D**: Poor security posture (60-69%)
- **F**: Failing security score (<60%)

## ML Model

### Model Input Features

The model analyzes the following features:

1. **Structural Features**:
   - Number of jobs
   - Number of steps
   - Pipeline complexity

2. **Security Features**:
   - Presence of secrets (binary)
   - Privileged access usage (binary)
   - Findings severity distribution

### Model Training

The model is trained separately using the `secflowcheck-model` service. To use a new model:

1. Train the model using the model service
2. Copy the model file to the analyzer service
3. Update `SECFLOWCHECK_MODEL_PATH` in `.env`
4. Restart the analyzer service

## Celery Tasks

### Asynchronous Analysis

The service uses Celery for background processing:

```python
from app.tasks import analyze_pipeline_task

# Queue an analysis task
result = analyze_pipeline_task.delay(parsed_pipeline)

# Get task result
task_result = result.get(timeout=10)
```

### Task Configuration

- **Broker**: Redis or RabbitMQ
- **Result Backend**: Redis
- **Concurrency**: Configurable worker count
- **Timeout**: 60 seconds per task

## Service Discovery

The analyzer registers with Eureka on startup:

```python
# Automatic registration
- App Name: analyzer-service
- Instance Port: 8003
- Health Check: /health
```

Other services can discover the analyzer via Eureka:
```
http://discovery:8761/eureka/apps/analyzer-service
```

## Integration Examples

### Using Python Requests

```python
import requests

# Prepare parsed pipeline data
parsed_data = {
    "filename": "ci.yml",
    "features": {
        "num_jobs": 2,
        "num_steps": 5,
        "has_secrets": 0,
        "privileged_access": 1
    },
    "findings": []
}

# Send to analyzer
response = requests.post(
    "http://localhost:8003/analyze",
    json=parsed_data
)

result = response.json()
print(f"Risk: {result['risk_score']}, Grade: {result['grade']}")
```

### Via Service Discovery

```python
import requests

# Discover service via Eureka
eureka_url = "http://discovery:8761/eureka/apps/analyzer-service"
response = requests.get(eureka_url)
instance = response.json()['application']['instance'][0]

analyzer_url = f"http://{instance['ipAddr']}:{instance['port']['$']}/analyze"
```

## Monitoring

### Health Checks

```bash
# Basic health check
curl http://localhost:8003/health

# Check if model is loaded
curl http://localhost:8003/health | jq '.model_loaded'
```

### Celery Monitoring

```bash
# Check worker status
celery -A app.tasks inspect active

# Monitor tasks
celery -A app.tasks inspect stats
```

## Troubleshooting

### Model won't load
- Verify `SECFLOWCHECK_MODEL_PATH` points to a valid model file
- Check file permissions
- Ensure model was trained with compatible scikit-learn version

### Celery connection errors
- Verify broker (Redis/RabbitMQ) is running
- Check `CELERY_BROKER` URL is correct
- Ensure network connectivity to broker

### Eureka registration fails
- Verify Eureka server is accessible
- Check `EUREKA_SERVER` URL
- Review Eureka server logs for errors

### Analysis takes too long
- Check Celery worker is running
- Monitor worker logs for errors
- Consider increasing worker concurrency

## Development

### Project Structure

```
secflowcheck-analyzer/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── ml/
│   │   └── model_loader.py  # ML model management
│   ├── tasks/
│   │   └── celery.py        # Celery tasks
│   ├── routes/
│   │   └── analyzer_routes.py
│   └── extensions.py        # App initialization
├── Dockerfile
├── requirements.txt
└── README.md
```

### Adding New Features

To extend the analyzer with new features:

1. Update feature extraction in parser service
2. Retrain ML model with new features
3. Update feature vector schema
4. Deploy updated model

## Performance

- **Average Analysis Time**: <500ms (synchronous)
- **Throughput**: ~100 requests/second (with 4 Celery workers)
- **Model Size**: ~5MB
- **Memory Usage**: ~200MB per worker

## License

Part of the SecFlowCheck project.
