import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score

from features import extract_features, FEATURE_NAMES

def load_raw_dataset(filepath="ml/data/ruom_dataset.json"):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    texts = [item["text"] for item in data]
    labels_binary = np.array([int(item["is_high_quality"]) for item in data])
    platforms = [item.get("platform", "linkedin_post") for item in data]
    
    # Hand engineered feature matrix
    feat_rows = [extract_features(t, p) for t, p in zip(texts, platforms)]
    X_hand = pd.DataFrame(feat_rows).values
    return texts, labels_binary, X_hand

def compute_embeddings(texts):
    print("\n[Embeddings Pipeline] Generating representations...")
    try:
        from sentence_transformers import SentenceTransformer
        print("Loading all-MiniLM-L6-v2 Sentence Transformer model...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = model.encode(texts, show_progress_bar=False)
        print(f"Computed dense sentence embeddings: shape {embeddings.shape}")
        return embeddings, "SentenceTransformers (all-MiniLM-L6-v2)"
    except Exception as e:
        print(f"SentenceTransformers not available or downloading ({e}). Using SVD Dense Semantic Projection fallback...")
        tfidf = TfidfVectorizer(ngram_range=(1, 2), max_features=500)
        tfidf_mat = tfidf.fit_transform(texts)
        svd = TruncatedSVD(n_components=32, random_state=42)
        dense_embeds = svd.fit_transform(tfidf_mat)
        print(f"Computed Dense TFIDF-SVD Embeddings: shape {dense_embeds.shape}")
        return dense_embeds, "Dense Semantic SVD (32-D)"

def run_comparative_study():
    os.makedirs("ml/artifacts", exist_ok=True)
    texts, y, X_hand = load_raw_dataset()
    X_embed, embed_name = compute_embeddings(texts)
    
    # Standardize hand features and concatenate for Hybrid
    scaler_hand = StandardScaler()
    X_hand_scaled = scaler_hand.fit_transform(X_hand)
    
    scaler_embed = StandardScaler()
    X_embed_scaled = scaler_embed.fit_transform(X_embed)
    
    X_hybrid = np.hstack([X_hand_scaled, X_embed_scaled])
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    configs = {
        "1. Hand-Engineered (20-D) - LogReg": (X_hand_scaled, LogisticRegression(C=1.0, max_iter=1000, random_state=42)),
        "2. Dense Embeddings - LogReg": (X_embed_scaled, LogisticRegression(C=1.0, max_iter=1000, random_state=42)),
        "3. Dense Embeddings - MLP (64, 32)": (X_embed_scaled, MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=800, random_state=42)),
        "4. Hybrid (Features + Embeddings) - LogReg": (X_hybrid, LogisticRegression(C=1.0, max_iter=1000, random_state=42)),
        "5. Hybrid - MLP (64, 32)": (X_hybrid, MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=800, random_state=42)),
    }
    
    results = {}
    print("\n" + "=" * 65)
    print("REPRESENTATION ABLATION BENCHMARK (5-Fold CV)")
    print("=" * 65)
    
    for name, (X_mat, clf) in configs.items():
        cv_res = cross_validate(clf, X_mat, y, cv=cv, scoring=["accuracy", "f1", "roc_auc"])
        acc = float(np.mean(cv_res["test_accuracy"]))
        f1 = float(np.mean(cv_res["test_f1"]))
        roc = float(np.mean(cv_res["test_roc_auc"]))
        results[name] = {"accuracy": round(acc, 4), "f1_score": round(f1, 4), "roc_auc": round(roc, 4)}
        print(f"[{name}]\n  -> Accuracy: {acc*100:.2f}% | F1: {f1:.4f} | ROC-AUC: {roc:.4f}\n")
        
    # Save comparison plot
    names = list(results.keys())
    accuracies = [results[n]["accuracy"] * 100 for n in names]
    f1_scores = [results[n]["f1_score"] * 100 for n in names]
    
    x = np.arange(len(names))
    width = 0.35
    
    plt.figure(figsize=(11, 6), dpi=200)
    plt.bar(x - width/2, accuracies, width, label="CV Accuracy (%)", color="#3b82f6")
    plt.bar(x + width/2, f1_scores, width, label="F1-Score (%)", color="#10b981")
    
    plt.ylabel("Performance (%)", fontsize=11, fontweight="bold")
    plt.title(f"Ablation: Hand Features vs. {embed_name} vs. Hybrid", fontsize=12, fontweight="bold", pad=12)
    plt.xticks(x, [n.replace(" - ", "\n") for n in names], fontsize=8, fontweight="medium")
    plt.ylim(90, 102)
    plt.legend(loc="lower right")
    plt.grid(axis="y", linestyle=":", alpha=0.6)
    plt.tight_layout()
    
    plot_path = "ml/artifacts/hybrid_comparison.png"
    plt.savefig(plot_path)
    plt.close()
    print(f"Saved representation comparison plot to {plot_path}")
    
    # Save metrics JSON
    with open("ml/artifacts/embedding_benchmark.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("Saved embedding ablation benchmark to ml/artifacts/embedding_benchmark.json")

if __name__ == "__main__":
    run_comparative_study()
