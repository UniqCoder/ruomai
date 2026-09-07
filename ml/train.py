import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold, train_test_split, cross_validate
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, RidgeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

from features import extract_features, FEATURE_NAMES

def load_data(filepath="ml/data/ruom_dataset.json"):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    rows = []
    labels_binary = []
    labels_score = []
    
    for item in data:
        feats = extract_features(item["text"], item.get("platform", "linkedin_post"))
        rows.append(feats)
        labels_binary.append(int(item["is_high_quality"]))
        labels_score.append(int(item["quality_score"]))
        
    df = pd.DataFrame(rows)
    y_bin = np.array(labels_binary)
    y_score = np.array(labels_score)
    return df, y_bin, y_score, data

def evaluate_models(X, y):
    print("=" * 60)
    print("RUOM SCORER - 5-FOLD STRATIFIED CROSS-VALIDATION")
    print("=" * 60)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    models = {
        "Logistic Regression": LogisticRegression(C=1.0, max_iter=1000, random_state=42),
        "Ridge Classifier": RidgeClassifier(random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, max_depth=3, random_state=42),
    }
    
    try:
        from xgboost import XGBClassifier
        models["XGBoost"] = XGBClassifier(n_estimators=80, max_depth=3, learning_rate=0.1, random_state=42, eval_metric="logloss")
    except ImportError:
        pass
        
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    
    results = {}
    for name, model in models.items():
        # Ridge classifier does not have predict_proba for roc_auc
        cur_scoring = [s for s in scoring if not (name == "Ridge Classifier" and s == "roc_auc")]
        cv_res = cross_validate(model, X_scaled if "Logistic" in name or "Ridge" in name else X, y, cv=cv, scoring=cur_scoring)
        
        acc = float(np.mean(cv_res["test_accuracy"]))
        prec = float(np.mean(cv_res["test_precision"]))
        rec = float(np.mean(cv_res["test_recall"]))
        f1 = float(np.mean(cv_res["test_f1"]))
        roc = float(np.mean(cv_res.get("test_roc_auc", [0.0]))) if "test_roc_auc" in cv_res else None
        
        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc, 4) if roc is not None else "N/A"
        }
        print(f"[{name}] Acc: {acc*100:.2f}% | F1: {f1:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | ROC-AUC: {roc}")
        
    return results, models, scaler

def train_and_export_artifacts(X, y, scaler):
    os.makedirs("ml/artifacts", exist_ok=True)
    
    # 80/20 Train-Test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, stratify=y, random_state=42)
    
    scaler_fit = StandardScaler()
    X_train_scaled = scaler_fit.fit_transform(X_train)
    X_test_scaled = scaler_fit.transform(X_test)
    
    # Train primary production Logistic Regression model (interpretable, zero-latency inference)
    log_reg = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    log_reg.fit(X_train_scaled, y_train)
    
    y_pred = log_reg.predict(X_test_scaled)
    y_proba = log_reg.predict_proba(X_test_scaled)[:, 1]
    
    test_acc = accuracy_score(y_test, y_pred)
    test_f1 = f1_score(y_test, y_pred)
    print(f"\nProduction Model (Logistic Regression) Test Set Accuracy: {test_acc*100:.2f}% | F1: {test_f1:.4f}")
    
    # 1. Feature Importance Plot
    coefficients = log_reg.coef_[0]
    sorted_idx = np.argsort(np.abs(coefficients))
    sorted_features = [FEATURE_NAMES[i] for i in sorted_idx]
    sorted_coeffs = coefficients[sorted_idx]
    
    colors = ["#10b981" if c > 0 else "#ef4444" for c in sorted_coeffs]
    
    plt.figure(figsize=(10, 8), dpi=200)
    plt.barh(range(len(sorted_features)), sorted_coeffs, color=colors, align="center")
    plt.yticks(range(len(sorted_features)), sorted_features, fontsize=10)
    plt.xlabel("Standardized Logistic Regression Coefficient (Weight)", fontsize=11, fontweight="bold")
    plt.title("RUOM Content Quality Scorer - Feature Importance", fontsize=13, fontweight="bold", pad=15)
    plt.axvline(0, color="gray", linestyle="--", alpha=0.7)
    plt.grid(axis="x", linestyle=":", alpha=0.6)
    plt.tight_layout()
    plot_path = "ml/artifacts/feature_importance.png"
    plt.savefig(plot_path)
    plt.close()
    print(f"Saved feature importance plot to {plot_path}")
    
    # 2. Confusion Matrix Plot
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6, 5), dpi=200)
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title("Test Confusion Matrix (80/20 Holdout)", fontsize=12, fontweight="bold")
    plt.colorbar()
    tick_marks = np.arange(2)
    plt.xticks(tick_marks, ["Low Quality (0)", "High Quality (1)"], fontsize=9)
    plt.yticks(tick_marks, ["Low Quality (0)", "High Quality (1)"], fontsize=9)
    
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], "d"),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black",
                     fontweight="bold")
    plt.ylabel("Actual Label", fontsize=10, fontweight="bold")
    plt.xlabel("Predicted Label", fontsize=10, fontweight="bold")
    plt.tight_layout()
    cm_path = "ml/artifacts/confusion_matrix.png"
    plt.savefig(cm_path)
    plt.close()
    print(f"Saved confusion matrix plot to {cm_path}")
    
    # 3. Export Portable Model Weights for zero-dependency browser & edge inference
    weights_export = {
        "model_type": "LogisticRegression",
        "feature_names": FEATURE_NAMES,
        "scaler_mean": [float(m) for m in scaler_fit.mean_],
        "scaler_scale": [float(s) for s in scaler_fit.scale_],
        "coefficients": [float(c) for c in log_reg.coef_[0]],
        "intercept": float(log_reg.intercept_[0]),
        "threshold": 0.5,
        "feature_importances": {
            feat: round(float(coeff), 4) for feat, coeff in zip(FEATURE_NAMES, log_reg.coef_[0])
        }
    }
    weights_path = "ml/artifacts/model_weights.json"
    with open(weights_path, "w", encoding="utf-8") as f:
        json.dump(weights_export, f, indent=2)
    print(f"Saved portable model weights to {weights_path}")
    
    # Copy to src for direct TypeScript bundling
    os.makedirs("src/lib/ml", exist_ok=True)
    with open("src/lib/ml/model_weights.json", "w", encoding="utf-8") as f:
        json.dump(weights_export, f, indent=2)
    print("Exported model weights to src/lib/ml/model_weights.json for web app runtime.")

def main():
    os.makedirs("ml/artifacts", exist_ok=True)
    os.makedirs("src/lib/ml", exist_ok=True)
    print("Generating dataset...")
    os.system("python ml/generate_dataset.py")
    
    df, y_bin, y_score, raw_data = load_data()
    print(f"Loaded {len(df)} samples with {df.shape[1]} features.")
    
    results, models, scaler = evaluate_models(df, y_bin)
    
    with open("ml/artifacts/model_metrics.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    train_and_export_artifacts(df, y_bin, scaler)
    print("\n[SUCCESS] Model training, evaluation, and artifact generation complete!")

if __name__ == "__main__":
    main()
