import json
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Load dataset
rows = []
with open("data/dataset.jsonl") as f:
    for line in f:
        sample = json.loads(line)
        rows.append({**sample["features"], "label": sample["label"]})

df = pd.DataFrame(rows)

X = df.drop(columns=["label"])
y = LabelEncoder().fit_transform(df["label"])

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42
)

model.fit(X, y)

joblib.dump(
    {
        "model": model,
        "features": list(X.columns)
    },
    "model/secflowcheck_model.joblib"
)

print("Model trained and saved")
