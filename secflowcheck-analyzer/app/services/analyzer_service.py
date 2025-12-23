from typing import Dict
from app.ml.model_loader import load_model
from app.ml.findings_generator import generate_findings_from_features



LABEL_MAP = {
    0: "A",
    1: "B",
    2: "C",
    3: "D"
}


def analyze_pipeline(pipeline: Dict) -> Dict:
    if "ml_features" not in pipeline:
        raise ValueError("Pipeline does not contain ml_features")

    features = pipeline["ml_features"]

    bundle = load_model()
    model = bundle["model"]
    feature_order = bundle["features"]

    # Build feature vector in correct order
    X = [[features[f] for f in feature_order]]

    prediction = model.predict(X)[0]
    score = LABEL_MAP.get(prediction, "E")

    findings = generate_findings_from_features(features)

    return {
        "pipeline_type": pipeline.get("pipeline_type", "Unknown"),
        "score": score,
        "total_findings": len(findings),
        "findings": [f.dict() for f in findings]
    }
