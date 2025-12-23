# SecFlowCheck Model Service

A Python-based service for training and managing machine learning models that predict security risks in CI/CD pipelines. This service includes data collection tools and model training scripts.

## Overview

The Model Service is responsible for:
- Collecting training data from real CI/CD pipeline repositories
- Processing and labeling pipeline security features
- Training Random Forest classification models
- Generating model artifacts for the Analyzer Service
- Managing dataset versions and model updates

## Features

- 📊 **Data Collection**: Automated pipeline data gathering from GitHub
- 🏷️ **Data Labeling**: Security risk labeling (LOW, MEDIUM, HIGH, CRITICAL)
- 🤖 **Model Training**: Random Forest classifier with optimized hyperparameters
- 💾 **Model Persistence**: Joblib serialization for deployment
- 📈 **Feature Engineering**: Extraction of security-relevant pipeline features

## Architecture

### Components

1. **Data Collector**: Fetches CI/CD pipeline files from repositories
2. **Training Pipeline**: Processes data and trains ML models
3. **Model Artifacts**: Serialized models ready for deployment

### Directory Structure

```
secflowcheck-model/
├── collector/              # Data collection scripts
│   └── collect_data.py    # GitHub pipeline collector
├── model/                  # Model training
│   └── train_model.py     # Training script
├── data/                   # Training datasets
│   └── dataset.jsonl      # Labeled pipeline data
├── requirements.txt
└── README.md
```

## Installation

### Prerequisites

- Python 3.8+
- GitHub API token (for data collection)
- scikit-learn, pandas, joblib

### Setup

1. **Navigate to the service directory:**
   ```bash
   cd secflowcheck-model
   ```

2. **Create virtual environment:**
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
   GITHUB_TOKEN=your_github_personal_access_token
   ```

## Data Collection

### Collecting Pipeline Data

The collector fetches CI/CD configuration files from GitHub repositories:

```bash
python collector/collect_data.py
```

**What it does:**
- Searches GitHub for workflow files (.github/workflows/*.yml)
- Downloads and analyzes pipeline configurations
- Extracts security features
- Labels pipelines based on security patterns
- Saves to `data/dataset.jsonl`

### Dataset Format

The dataset is stored in JSONL format (one JSON object per line):

```json
{
  "filename": "ci.yml",
  "features": {
    "num_jobs": 3,
    "num_steps": 8,
    "has_secrets": 1,
    "privileged_access": 0
  },
  "label": "HIGH"
}
```

### Feature Schema

| Feature | Type | Description |
|---------|------|-------------|
| `num_jobs` | Integer | Number of jobs in pipeline |
| `num_steps` | Integer | Total steps across all jobs |
| `has_secrets` | Binary (0/1) | Whether secrets detected |
| `privileged_access` | Binary (0/1) | Whether privileged access detected |

### Label Classes

- **LOW**: Secure pipeline, no significant issues
- **MEDIUM**: Minor security concerns
- **HIGH**: Significant security risks
- **CRITICAL**: Severe vulnerabilities

## Model Training

### Training the Model

```bash
python model/train_model.py
```

**Output:**
- Trained model saved to `model/secflowcheck_model.joblib`
- Model includes:
  - Random Forest classifier
  - Feature column names
  - Model metadata

### Model Configuration

The model uses the following hyperparameters:

```python
RandomForestClassifier(
    n_estimators=200,        # Number of trees
    max_depth=12,            # Maximum tree depth
    min_samples_leaf=2,      # Minimum samples per leaf
    max_features='sqrt',     # Features per split
    random_state=42          # Reproducibility
)
```

### Model Performance

Expected performance metrics:
- **Accuracy**: ~85-90%
- **Precision**: ~80-85%
- **Recall**: ~80-85%
- **F1-Score**: ~80-85%

Performance varies based on:
- Dataset size
- Data quality
- Feature engineering
- Class balance

## Using the Trained Model

### Loading the Model

```python
import joblib

# Load model
model_data = joblib.load("model/secflowcheck_model.joblib")
model = model_data["model"]
features = model_data["features"]

# Prepare input
import pandas as pd
pipeline_features = pd.DataFrame([{
    "num_jobs": 2,
    "num_steps": 5,
    "has_secrets": 0,
    "privileged_access": 1
}])

# Predict
prediction = model.predict(pipeline_features)
probability = model.predict_proba(pipeline_features)

print(f"Risk Level: {prediction[0]}")
print(f"Confidence: {max(probability[0])}")
```

### Deploying the Model

To deploy the model to the Analyzer Service:

1. **Copy model file:**
   ```bash
   cp model/secflowcheck_model.joblib ../secflowcheck-analyzer/models/
   ```

2. **Update analyzer configuration:**
   ```env
   SECFLOWCHECK_MODEL_PATH=/app/models/secflowcheck_model.joblib
   ```

3. **Restart analyzer service:**
   ```bash
   docker-compose restart analyzer
   ```

## Data Collection Configuration

### GitHub API Access

The collector requires a GitHub personal access token:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Add to `.env` as `GITHUB_TOKEN`

### Customizing Data Collection

Edit `collector/collect_data.py` to customize:

```python
# Search query
search_query = "filename:.github/workflows/*.yml"

# Number of repositories
max_repos = 100

# File filters
file_extensions = ['.yml', '.yaml']
```

## Model Retraining

### When to Retrain

Retrain the model when:
- New security patterns emerge
- Dataset grows significantly (>20% new data)
- Model performance degrades
- New features are added

### Retraining Workflow

1. **Collect new data:**
   ```bash
   python collector/collect_data.py
   ```

2. **Verify data quality:**
   ```bash
   # Check dataset
   wc -l data/dataset.jsonl
   head -n 5 data/dataset.jsonl
   ```

3. **Train new model:**
   ```bash
   python model/train_model.py
   ```

4. **Evaluate model:**
   ```python
   # Add evaluation script
   from sklearn.model_selection import cross_val_score
   scores = cross_val_score(model, X, y, cv=5)
   print(f"Average Accuracy: {scores.mean():.2f}")
   ```

5. **Deploy if better:**
   - Compare with current model performance
   - Deploy if improvements exist

## Advanced Usage

### Feature Engineering

Add new features by modifying the parser service and updating the model:

```python
# In parser service
features = {
    "num_jobs": count_jobs(),
    "num_steps": count_steps(),
    "has_secrets": detect_secrets(),
    "privileged_access": detect_privileged(),
    # New features
    "external_dependencies": count_external_deps(),
    "code_injection_risk": check_code_injection()
}
```

Then retrain the model with the enhanced dataset.

### Hyperparameter Tuning

Optimize model performance:

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [10, 12, 15],
    'min_samples_leaf': [1, 2, 4]
}

grid_search = GridSearchCV(
    RandomForestClassifier(),
    param_grid,
    cv=5
)

grid_search.fit(X, y)
best_model = grid_search.best_estimator_
```

### Class Balancing

Handle imbalanced datasets:

```python
from sklearn.utils.class_weight import compute_class_weight

# Compute class weights
class_weights = compute_class_weight(
    'balanced',
    classes=np.unique(y),
    y=y
)

# Train with balanced weights
model = RandomForestClassifier(
    class_weight='balanced',
    ...
)
```

## Monitoring Model Performance

### Tracking Metrics

Keep track of model performance over time:

```python
import json
from datetime import datetime

metrics = {
    "timestamp": datetime.now().isoformat(),
    "accuracy": 0.87,
    "precision": 0.85,
    "recall": 0.82,
    "dataset_size": len(X)
}

with open("model/metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
```

### A/B Testing

Deploy multiple model versions and compare:

1. Train new model as `secflowcheck_model_v2.joblib`
2. Configure analyzer to use both models
3. Compare predictions on test data
4. Promote better-performing model

## Troubleshooting

### Data collection fails
- Verify GitHub token is valid
- Check API rate limits
- Ensure network connectivity to GitHub

### Model training errors
- Verify dataset format is correct
- Check for missing values
- Ensure sufficient data (minimum 100 samples)

### Poor model performance
- Collect more training data
- Balance class distribution
- Add more informative features
- Tune hyperparameters

### Model won't load in analyzer
- Verify scikit-learn versions match
- Check file permissions
- Ensure correct file path

## License

Part of the SecFlowCheck project.
