import json
from pipline_parser import parse_pipeline


def build_sample(yaml_text):
    parsed = parse_pipeline(yaml_text)
    features = parsed["ml_features"]

    # Weak labeling strategy (rule-derived)
    score = 100
    if features["uses_write_all_permissions"]:
        score -= 30
    score -= features["uses_unpinned_actions_count"] * 10
    score -= features["plaintext_secrets_count"] * 20
    if not features["has_security_steps"]:
        score -= 10

    if score >= 80:
        label = "A"
    elif score >= 60:
        label = "B"
    elif score >= 40:
        label = "C"
    else:
        label = "D"

    return {
        "features": features,
        "label": label
    }


def save_dataset(samples, path="data/dataset.jsonl"):
    with open(path, "w") as f:
        for s in samples:
            f.write(json.dumps(s) + "\n")
