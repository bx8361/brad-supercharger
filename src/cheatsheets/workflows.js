// Standard operating procedures: each entry is a numbered flow, a step table, and runnable code.
import { PT, KR, HF } from './frameworks.js'

const SK = 'scikit-learn'
const PD = 'pandas'
const SECTION = 'Workflows (SOP)'
const stepHead = ['Step', 'Do', 'Watch out for']

export const mlWorkflows = [
  {
    id: 'sop-holdout', name: 'SOP: Holdout baseline', section: SECTION, lib: SK,
    flow: ['Split', 'Preprocess', 'Train', 'Evaluate (valid)', 'Iterate', 'Test once'],
    summary: 'The simplest honest workflow: train / validation / test, with preprocessing fitted on train only.',
    use: 'Large datasets (≥ 50k rows) where one validation split is stable, or a first quick pass on any problem.',
    keywords: 'sop workflow pipeline procedure steps baseline holdout train valid test evaluate',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', '`train_test_split` twice → 60 / 20 / 20, `stratify=y` for classification', 'Split before any look at statistics. Use a time or group split if rows are not independent.'],
        ['2. Preprocess', 'Build a `Pipeline` / `ColumnTransformer`; fit it only on train', 'Fitting scalers, imputers, or encoders on all data leaks test information.'],
        ['3. Train', 'Start with `DummyClassifier`, then a simple model, then boosting', 'If the model cannot beat the dummy, check the target and features.'],
        ['4. Evaluate', 'Score on the validation set with the metric that matches the business cost', 'Compare train vs valid scores to spot overfitting.'],
        ['5. Iterate', 'Change features or hyperparameters, re-evaluate on valid', 'Every peek at valid fits to it a little; keep the number of rounds reasonable.'],
        ['6. Test once', 'Refit on train + valid, score on test, report it', 'Never tune after seeing the test score.'],
      ],
    }],
    snippets: [{
      title: 'Holdout workflow',
      code: `from sklearn.model_selection import train_test_split
from sklearn.dummy import DummyClassifier
from sklearn.pipeline import make_pipeline
from sklearn.compose import make_column_transformer, make_column_selector as sel
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

# 1. Split 60 / 20 / 20
X_tmp, X_test, y_tmp, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
X_train, X_val, y_train, y_val = train_test_split(X_tmp, y_tmp, test_size=0.25, stratify=y_tmp, random_state=42)

# 2. Preprocess (inside the pipeline, so it is fitted on train only)
pre = make_column_transformer(
    (make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), sel(dtype_include="number")),
    (make_pipeline(SimpleImputer(strategy="most_frequent"), OneHotEncoder(handle_unknown="ignore")),
     sel(dtype_include=["object", "category"])),
)

# 3. Train: baseline first, then a real model
dummy = DummyClassifier(strategy="prior").fit(X_train, y_train)
model = make_pipeline(pre, LogisticRegression(max_iter=1000)).fit(X_train, y_train)

# 4. Evaluate on validation
print("dummy", roc_auc_score(y_val, dummy.predict_proba(X_val)[:, 1]))
print("model", roc_auc_score(y_val, model.predict_proba(X_val)[:, 1]))

# 6. Final: refit on train + valid, test once
model.fit(X_tmp, y_tmp)
print("test", roc_auc_score(y_test, model.predict_proba(X_test)[:, 1]))`,
    }],
  },
  {
    id: 'sop-grid-search', name: 'SOP: Cross-validation + grid search', section: SECTION, lib: SK,
    flow: ['Split', 'Pipeline', 'CV baseline', 'Grid / random search', 'Refit best', 'Test'],
    summary: 'The default workflow for small and medium tabular data: tune with CV on the training set, keep a test set untouched.',
    use: 'Datasets up to a few hundred thousand rows where CV is affordable. Use randomized search when the grid has more than ~50 combinations.',
    keywords: 'sop workflow gridsearchcv randomizedsearchcv tuning hyperparameter cross validation refit',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'One `train_test_split` (80 / 20); the CV folds play the role of the validation set', 'Stratify for classification; group or time splits where needed.'],
        ['2. Pipeline', 'Preprocessing + model in one `Pipeline`', 'Without a pipeline, CV folds leak preprocessing statistics.'],
        ['3. CV baseline', '`cross_validate` with default parameters', 'Record mean ± std; differences smaller than the std are noise.'],
        ['4. Search', '`GridSearchCV` (small grid) or `RandomizedSearchCV` (large space, `n_iter` 30–100)', 'Use `step__param` names. Coarse-to-fine: random search wide, then a small grid around the best.'],
        ['5. Refit', '`refit=True` retrains `best_estimator_` on the whole training set', 'Check `cv_results_` for a flat optimum rather than one lucky spike.'],
        ['6. Test', 'Score `best_estimator_` on the test set once', 'Expect the test score to be slightly below `best_score_` (selection bias).'],
      ],
    }],
    snippets: [{
      title: 'CV + grid search',
      code: `from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
pipe = Pipeline([("pre", pre), ("clf", RandomForestClassifier(random_state=0, n_jobs=-1))])
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)

# 3. Baseline
base = cross_validate(pipe, X_train, y_train, cv=cv, scoring="roc_auc", return_train_score=True)
print(base["test_score"].mean(), base["test_score"].std(), base["train_score"].mean())

# 4–5. Search and refit
grid = GridSearchCV(pipe, {
    "clf__n_estimators": [300],
    "clf__max_depth": [None, 10, 20],
    "clf__min_samples_leaf": [1, 3, 10],
    "clf__max_features": ["sqrt", 0.5],
}, scoring="roc_auc", cv=cv, n_jobs=-1, verbose=1)
grid.fit(X_train, y_train)
print(grid.best_params_, grid.best_score_)

# 6. Test once
print("test", grid.score(X_test, y_test))`,
    }],
  },
  {
    id: 'sop-compare-models', name: 'SOP: Compare model families', section: SECTION, lib: SK,
    flow: ['Split', 'Same CV folds', 'Dummy + candidates', 'cross_validate each', 'Pick 1–2', 'Tune', 'Test'],
    summary: 'Screen several algorithms fairly before spending time on tuning.',
    use: 'Start of a new problem when you do not know which family fits.',
    keywords: 'sop workflow compare models benchmark candidates spot check model selection',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'Hold out a test set', ''],
        ['2. Fix folds', 'One `cv` object with `random_state`', 'Every model must see identical folds or the comparison is noisy.'],
        ['3. Candidates', 'Dummy, linear, KNN/SVM (scaled), random forest, gradient boosting', 'Each candidate in its own pipeline with the preprocessing it needs.'],
        ['4. Score', '`cross_validate` with the same scoring, record mean, std, and fit time', 'Look at both the score and its spread.'],
        ['5. Pick', 'Keep the best one or two (prefer the simpler model when scores overlap)', ''],
        ['6–7. Tune & test', 'Follow the grid-search SOP for the chosen model', ''],
      ],
    }],
    snippets: [{
      title: 'Spot-check several models',
      code: `import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import make_pipeline
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier

cv = StratifiedKFold(5, shuffle=True, random_state=0)
candidates = {
    "dummy": DummyClassifier(),
    "logreg": LogisticRegression(max_iter=2000),
    "knn": KNeighborsClassifier(15),
    "rf": RandomForestClassifier(500, n_jobs=-1, random_state=0),
    "hgb": HistGradientBoostingClassifier(random_state=0),
}
rows = []
for name, est in candidates.items():
    r = cross_validate(make_pipeline(pre, est), X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1)
    rows.append({"model": name, "auc": r["test_score"].mean(), "std": r["test_score"].std(), "fit_s": r["fit_time"].mean()})
pd.DataFrame(rows).sort_values("auc", ascending=False)`,
    }],
  },
  {
    id: 'sop-boosting', name: 'SOP: Gradient boosting with early stopping', section: SECTION, lib: [SK, 'XGBoost', 'LightGBM', 'CatBoost'],
    flow: ['Split train/valid/test', 'Encode categoricals', 'Fit with early stopping', 'Tune (Optuna / random)', 'Refit with best rounds', 'Test'],
    summary: 'The usual workflow for XGBoost, LightGBM, and CatBoost: let early stopping pick the number of trees, tune the rest.',
    use: 'Tabular data where you want the strongest model. Skip scaling; trees do not need it.',
    keywords: 'sop workflow boosting xgboost lightgbm catboost early stopping optuna n_estimators best_iteration',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'Train / valid / test (or train / test plus CV)', 'Early stopping on the test set leaks: always use a separate valid set.'],
        ['2. Categoricals', 'CatBoost: `cat_features`; LightGBM / XGBoost: `category` dtype with `enable_categorical=True` (XGB)', 'No scaling or one-hot needed for trees.'],
        ['3. Early stopping', 'Large `n_estimators` (2000–10000), `learning_rate` 0.03–0.1, stop after 50–200 rounds without improvement', 'Set `eval_metric` to what you care about.'],
        ['4. Tune', 'Depth / leaves, min child size, subsampling, regularization', 'Tune with a fixed learning rate; lower it at the end for a small extra gain.'],
        ['5. Refit', 'Refit on train + valid with `n_estimators ≈ best_iteration × 1.1`', 'Or keep the early-stopped model if data is plentiful.'],
        ['6. Test', 'Score once on test', ''],
      ],
    }],
    snippets: [{
      title: 'LightGBM with early stopping',
      code: `import lightgbm as lgb
from sklearn.metrics import roc_auc_score

model = lgb.LGBMClassifier(n_estimators=5000, learning_rate=0.05, num_leaves=31,
                           subsample=0.8, subsample_freq=1, colsample_bytree=0.8, verbose=-1)
model.fit(X_train, y_train, eval_set=[(X_val, y_val)], eval_metric="auc",
          callbacks=[lgb.early_stopping(100), lgb.log_evaluation(200)])
best_n = model.best_iteration_

# Refit on train + valid with the found number of trees
final = lgb.LGBMClassifier(**{**model.get_params(), "n_estimators": int(best_n * 1.1)})
final.fit(pd.concat([X_train, X_val]), pd.concat([y_train, y_val]))
print("test", roc_auc_score(y_test, final.predict_proba(X_test)[:, 1]))

# XGBoost:  XGBClassifier(n_estimators=5000, early_stopping_rounds=100, eval_metric="auc").fit(X_train, y_train, eval_set=[(X_val, y_val)])
# CatBoost: CatBoostClassifier(iterations=5000, od_wait=100).fit(X_train, y_train, eval_set=(X_val, y_val), cat_features=cats)`,
    }],
  },
  {
    id: 'sop-nested-cv', name: 'SOP: Nested cross-validation', section: SECTION, lib: SK,
    flow: ['Outer CV split', 'Inner CV search', 'Score on outer fold', 'Average outer scores', 'Final search on all data'],
    summary: 'An unbiased estimate of “tuned model” performance when the data is too small to spare a test set.',
    use: 'Small datasets (hundreds to a few thousand rows), papers, and comparisons where a single test split is too noisy.',
    keywords: 'sop workflow nested cv cross validation small data unbiased estimate',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Outer CV', '5-fold (or repeated) split of all data', 'The outer folds estimate performance; they are never used for tuning.'],
        ['2. Inner CV', '`GridSearchCV` with its own 3–5 folds inside each outer training fold', ''],
        ['3. Score', '`cross_val_score(search, X, y, cv=outer)` does steps 1–3 in one call', 'Slow: outer × inner × grid size fits.'],
        ['4. Report', 'Mean ± std of the outer scores', 'This is the number to report, not `best_score_`.'],
        ['5. Final model', 'Run the search once more on all data and deploy `best_estimator_`', ''],
      ],
    }],
    snippets: [{
      title: 'Nested CV',
      code: `from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_score
from sklearn.svm import SVC

inner = StratifiedKFold(5, shuffle=True, random_state=1)
outer = StratifiedKFold(5, shuffle=True, random_state=2)
search = GridSearchCV(make_pipeline(pre, SVC()),
                      {"svc__C": [0.1, 1, 10, 100], "svc__gamma": ["scale", 0.01, 0.1]},
                      cv=inner, scoring="roc_auc", n_jobs=-1)
scores = cross_val_score(search, X, y, cv=outer, scoring="roc_auc")
print(f"{scores.mean():.3f} ± {scores.std():.3f}")

final = search.fit(X, y).best_estimator_`,
    }],
  },
  {
    id: 'sop-imbalanced', name: 'SOP: Imbalanced classification', section: SECTION, lib: [SK, 'imbalanced-learn'],
    flow: ['Stratified split', 'Pick PR-based metric', 'Weights or resampling', 'CV tune', 'Tune threshold', 'Calibrate (opt.)', 'Test'],
    summary: 'Fraud, churn, defects, rare diseases: the positive class is < ~10% of rows.',
    use: 'When accuracy looks high but the model rarely predicts the minority class.',
    keywords: 'sop workflow imbalanced rare class fraud smote class_weight threshold calibration pr auc',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', '`stratify=y`, `StratifiedKFold`', 'Small minority counts make folds noisy; use repeated CV.'],
        ['2. Metric', 'Average precision (PR AUC), F1, recall at fixed precision, or expected cost', 'Accuracy and ROC AUC look optimistic on heavy imbalance.'],
        ['3. Rebalance', "`class_weight='balanced'` / `scale_pos_weight` first; SMOTE only inside an `imblearn` pipeline", 'Resampling before the split leaks synthetic copies into validation.'],
        ['4. Tune', 'Usual CV search with the metric from step 2', ''],
        ['5. Threshold', '`TunedThresholdClassifierCV` or pick from the PR curve on validation', 'The default 0.5 cut-off is rarely right.'],
        ['6. Calibrate', '`CalibratedClassifierCV` if you need real probabilities', 'Reweighting and resampling distort probabilities.'],
        ['7. Test', 'Report PR AUC, confusion matrix at the chosen threshold', ''],
      ],
    }],
    snippets: [{
      title: 'Weights + threshold tuning',
      code: `from sklearn.model_selection import train_test_split, TunedThresholdClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import average_precision_score, classification_report

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
clf = make_pipeline(pre, HistGradientBoostingClassifier(class_weight="balanced", random_state=0))
tuned = TunedThresholdClassifierCV(clf, scoring="f1", cv=5).fit(X_train, y_train)
print("threshold", tuned.best_threshold_)
print("PR AUC", average_precision_score(y_test, tuned.predict_proba(X_test)[:, 1]))
print(classification_report(y_test, tuned.predict(X_test)))

# Resampling variant (pip install imbalanced-learn)
# from imblearn.pipeline import make_pipeline as imb_pipeline
# from imblearn.over_sampling import SMOTE
# clf = imb_pipeline(pre, SMOTE(random_state=0), LogisticRegression(max_iter=1000))`,
    }],
  },
  {
    id: 'sop-time-series', name: 'SOP: Time-series forecasting (tabular)', section: SECTION, lib: [SK, 'LightGBM'],
    flow: ['Sort by time', 'Lag / rolling features', 'Chronological split', 'TimeSeriesSplit CV', 'Walk-forward backtest', 'Test on latest period'],
    summary: 'Turn a series into a supervised table with lag features and validate without looking into the future.',
    use: 'Demand, sales, sensor, or traffic forecasting with gradient boosting or linear models.',
    keywords: 'sop workflow time series forecast lag rolling shift timeseriessplit backtest walk forward leakage',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Sort', '`df.sort_values(["id", "date"])`', ''],
        ['2. Features', 'Lags `shift(k)`, rolling stats on `shift(1)`, calendar features (dow, month, holiday)', 'Rolling windows must end before the target row: always `shift(1)` first.'],
        ['3. Split', 'Last period (e.g. last 4 weeks) is the test set', 'Never a random split.'],
        ['4. CV', '`TimeSeriesSplit(n_splits=5, gap=horizon)`', '`gap` stops lags of the test rows from overlapping the training rows.'],
        ['5. Backtest', 'Refit on an expanding window, predict the next horizon, repeat', 'Compare to a naive forecast (last value, or same day last week).'],
        ['6. Test', 'Score on the held-out latest period', 'Use MAE / RMSE / MAPE (careful near zero).'],
      ],
    }],
    snippets: [{
      title: 'Lag features + TimeSeriesSplit',
      code: `from sklearn.model_selection import TimeSeriesSplit, cross_val_score
import lightgbm as lgb

df = df.sort_values("date")
for k in (1, 7, 14):
    df[f"lag_{k}"] = df["y"].shift(k)
df["roll7_mean"] = df["y"].shift(1).rolling(7).mean()
df["dow"] = df["date"].dt.dayofweek
df = df.dropna()

features = [c for c in df.columns if c not in ("date", "y")]
cutoff = df["date"].max() - pd.Timedelta(days=28)
train, test = df[df["date"] <= cutoff], df[df["date"] > cutoff]

tscv = TimeSeriesSplit(n_splits=5, gap=7)
model = lgb.LGBMRegressor(n_estimators=500, learning_rate=0.05, verbose=-1)
print(cross_val_score(model, train[features], train["y"], cv=tscv, scoring="neg_mean_absolute_error"))

model.fit(train[features], train["y"])
naive_mae = (test["y"] - test["lag_7"]).abs().mean()
model_mae = (test["y"] - model.predict(test[features])).abs().mean()
print(f"naive {naive_mae:.2f}  model {model_mae:.2f}")`,
    }],
  },
  {
    id: 'sop-text', name: 'SOP: Text classification (classic ML)', section: SECTION, lib: SK,
    flow: ['Split', 'TF-IDF', 'Linear model', 'Grid ngram / C', 'Error analysis', 'Test'],
    summary: 'A fast, strong baseline for spam, topic, sentiment, and ticket routing before trying transformers.',
    use: 'Up to millions of short documents; when you need a model in minutes on a CPU.',
    keywords: 'sop workflow text nlp tfidf linearsvc logistic regression ngram sentiment classification',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'Stratified split; deduplicate texts first', 'Duplicates across train and test inflate scores.'],
        ['2. Vectorize', '`TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)`', 'Fit inside the pipeline only.'],
        ['3. Model', '`LogisticRegression` or `LinearSVC`; `ComplementNB` as a quick baseline', ''],
        ['4. Tune', '`ngram_range`, `min_df`, `C`', 'Character n-grams (`analyzer="char_wb"`) help with typos and short texts.'],
        ['5. Error analysis', 'Read misclassified examples and the top-weighted terms', 'Often reveals label noise or leaked tokens (signatures, IDs).'],
        ['6. Test', 'Classification report on test', ''],
      ],
    }],
    snippets: [{
      title: 'TF-IDF + linear model',
      code: `from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.model_selection import GridSearchCV
import numpy as np

pipe = make_pipeline(TfidfVectorizer(sublinear_tf=True, min_df=2), LinearSVC())
grid = GridSearchCV(pipe, {
    "tfidfvectorizer__ngram_range": [(1, 1), (1, 2)],
    "linearsvc__C": [0.1, 0.5, 1, 2],
}, cv=5, scoring="f1_macro", n_jobs=-1).fit(texts_train, y_train)
print(grid.best_params_, grid.score(texts_test, y_test))

# Top terms per class (binary)
vec, svm = grid.best_estimator_[0], grid.best_estimator_[-1]
terms = np.array(vec.get_feature_names_out())
print(terms[np.argsort(svm.coef_[0])[-20:]])`,
    }],
  },
  {
    id: 'sop-feature-selection', name: 'SOP: Feature selection inside CV', section: SECTION, lib: SK,
    flow: ['Split', 'Pipeline with selector', 'Tune k / threshold', 'Check stability', 'Test'],
    summary: 'Select features without leaking the target: the selector must be a pipeline step.',
    use: 'Many features (hundreds+), slow models, or when you need a smaller interpretable model.',
    keywords: 'sop workflow feature selection selectkbest rfecv selectfrommodel leakage pipeline',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'Hold out a test set', ''],
        ['2. Pipeline', 'preprocess → `VarianceThreshold` → `SelectKBest` / `SelectFromModel` → model', 'Selecting on all data before CV is one of the most common leaks.'],
        ['3. Tune', 'Search `k` or `threshold` together with model parameters', ''],
        ['4. Stability', 'Check which features are selected across folds (`return_estimator=True`)', 'Unstable selections mean the features are interchangeable or noisy.'],
        ['5. Test', 'Score once on test', ''],
      ],
    }],
    snippets: [{
      title: 'Tune k inside the pipeline',
      code: `from sklearn.feature_selection import SelectKBest, mutual_info_classif
from sklearn.model_selection import GridSearchCV

pipe = make_pipeline(pre, SelectKBest(mutual_info_classif), LogisticRegression(max_iter=2000))
grid = GridSearchCV(pipe, {"selectkbest__k": [10, 20, 50, "all"], "logisticregression__C": [0.1, 1, 10]},
                    cv=5, scoring="roc_auc", n_jobs=-1).fit(X_train, y_train)
best = grid.best_estimator_
kept = best[:-1].get_feature_names_out()
print(len(kept), kept[:20], grid.score(X_test, y_test))`,
    }],
  },
  {
    id: 'sop-clustering', name: 'SOP: Clustering', section: SECTION, lib: SK,
    flow: ['Select features', 'Impute + scale', 'Reduce (PCA, opt.)', 'Choose k / eps', 'Fit', 'Profile clusters', 'Check stability'],
    summary: 'Customer segmentation and grouping without labels.',
    use: 'Exploratory grouping; there is no test set, so judge clusters by metrics, stability, and whether they are useful.',
    keywords: 'sop workflow clustering segmentation kmeans silhouette elbow profile unsupervised',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Features', 'Pick behavior features that define “similar”', 'IDs and target-like columns dominate distances.'],
        ['2. Scale', '`StandardScaler` (or `RobustScaler`), one-hot or drop categoricals', 'Unscaled features with large ranges decide the clusters alone.'],
        ['3. Reduce', '`PCA(n_components=0.9)` for many correlated features', ''],
        ['4. Choose k', 'Silhouette and elbow for KMeans; k-distance plot for DBSCAN `eps`', 'Metrics disagree often; prefer the k that is interpretable.'],
        ['5. Fit', '`KMeans(n_clusters=k, n_init=10)` or `HDBSCAN(min_cluster_size=…)`', ''],
        ['6. Profile', '`df.groupby("cluster").mean()` on original (unscaled) columns + sizes', 'Name each cluster; tiny clusters may be outliers.'],
        ['7. Stability', 'Refit with other seeds / bootstrap samples, compare with `adjusted_rand_score`', ''],
      ],
    }],
    snippets: [{
      title: 'KMeans segmentation',
      code: `from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, adjusted_rand_score

Z = make_pipeline(StandardScaler(), PCA(n_components=0.9, random_state=0)).fit_transform(df[cols])
scores = {k: silhouette_score(Z, KMeans(k, n_init=10, random_state=0).fit_predict(Z)) for k in range(2, 11)}
k = max(scores, key=scores.get)

labels = KMeans(k, n_init=10, random_state=0).fit_predict(Z)
df["cluster"] = labels
print(df.groupby("cluster")[cols].mean().round(2).assign(size=df["cluster"].value_counts()))
print("stability", adjusted_rand_score(labels, KMeans(k, n_init=10, random_state=1).fit_predict(Z)))`,
    }],
  },
  {
    id: 'sop-anomaly', name: 'SOP: Anomaly detection', section: SECTION, lib: SK,
    flow: ['Clean training data', 'Scale', 'Fit detector', 'Score', 'Set threshold', 'Review top anomalies', 'Validate with labels'],
    summary: 'Find unusual rows (fraud, faults, data errors) with little or no labeled data.',
    use: 'When positives are too rare or unknown to train a classifier. With enough labels, prefer the imbalanced-classification SOP.',
    keywords: 'sop workflow anomaly outlier detection isolation forest fraud novelty threshold',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Data', 'Train on mostly normal data (novelty) or all data (outlier detection)', ''],
        ['2. Scale', 'Needed for LOF / OneClassSVM; not for IsolationForest', ''],
        ['3. Fit', '`IsolationForest(contamination="auto")` as the default', ''],
        ['4. Score', '`-score_samples(X)` = higher is more anomalous', 'Work with scores, not just the ±1 labels.'],
        ['5. Threshold', 'Top-N or a percentile that matches review capacity', ''],
        ['6. Review', 'Inspect the top anomalies with domain experts', 'Many “anomalies” turn out to be data errors.'],
        ['7. Validate', 'If a few labels exist, compute precision@N or PR AUC on them', ''],
      ],
    }],
    snippets: [{
      title: 'IsolationForest scoring',
      code: `from sklearn.ensemble import IsolationForest
import numpy as np

iso = IsolationForest(n_estimators=300, contamination="auto", random_state=0).fit(X_train)
score = -iso.score_samples(X_new)            # higher = more anomalous
threshold = np.percentile(score, 99)         # flag the top 1%
flagged = X_new[score >= threshold]

# Validate against the few labels you have
from sklearn.metrics import average_precision_score
print("PR AUC", average_precision_score(y_labeled, -iso.score_samples(X_labeled)))`,
    }],
  },
  {
    id: 'sop-deploy', name: 'SOP: Final model & deployment', section: SECTION, lib: SK,
    flow: ['Freeze choices', 'Refit on all data', 'Save + versions', 'Load & smoke test', 'Predict', 'Monitor'],
    summary: 'From a validated pipeline to a model file you can load and trust.',
    use: 'After the test score is final.',
    keywords: 'sop workflow deploy production save load joblib refit monitor drift',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Freeze', 'Fix features, preprocessing, and hyperparameters from validation', ''],
        ['2. Refit', 'Fit the full pipeline on all labeled data (train + valid + test)', 'More data almost always helps; the test score stays your estimate.'],
        ['3. Save', '`joblib.dump(pipeline)` plus library versions and feature list', 'Pickles break across library versions.'],
        ['4. Smoke test', 'Load in a fresh process, predict on a few known rows, compare outputs', ''],
        ['5. Predict', 'Pass raw DataFrames with the same columns; the pipeline does preprocessing', ''],
        ['6. Monitor', 'Track input distributions and live metrics; retrain on a schedule', 'Data drift silently degrades models.'],
      ],
    }],
    snippets: [{
      title: 'Save with metadata',
      code: `import joblib, json, sklearn, platform
final = grid.best_estimator_.fit(X, y)
joblib.dump(final, "model.joblib", compress=3)
json.dump({"sklearn": sklearn.__version__, "python": platform.python_version(),
           "features": list(X.columns), "params": grid.best_params_}, open("model.json", "w"), indent=2, default=str)

loaded = joblib.load("model.joblib")
assert (loaded.predict(X.head(20)) == final.predict(X.head(20))).all()`,
    }],
  },
]

export const nnWorkflows = [
  {
    id: 'nn-sop-basic', name: 'SOP: Train a network from scratch', section: SECTION, lib: PT,
    flow: ['Split data', 'Dataset & DataLoader', 'Model', 'Loss + optimizer', 'Train / validate per epoch', 'Early stop + checkpoint', 'Load best → test'],
    summary: 'The standard PyTorch supervised workflow.',
    use: 'Any supervised task once the data fits a Dataset: images, tabular, sequences.',
    keywords: 'sop workflow pytorch train validate test epoch loop checkpoint early stopping',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'Train / valid / test before building loaders', 'Compute normalization stats on train only.'],
        ['2. Data', '`Dataset` + `DataLoader(shuffle=True)` for train, `shuffle=False` for valid/test', 'Augment only the training set.'],
        ['3. Model', 'Small model first; check output shape on one batch', ''],
        ['4. Loss + optimizer', 'Loss from the loss chooser; `AdamW(lr=1e-3, weight_decay=1e-2)`', 'Pass raw logits to `CrossEntropyLoss` / `BCEWithLogitsLoss`.'],
        ['5. Loop', '`model.train()` → train epoch; `model.eval()` + `torch.no_grad()` → valid epoch', 'Forgetting `eval()` keeps dropout and BatchNorm in training mode.'],
        ['6. Early stop', 'Save `state_dict` when the valid metric improves; stop after `patience` epochs', ''],
        ['7. Test', 'Load the best checkpoint, evaluate once on test', ''],
      ],
    }],
    snippets: [{
      title: 'Full loop',
      code: `import torch, torch.nn as nn
device = "cuda" if torch.cuda.is_available() else "cpu"
model = Net().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

def run(loader, train):
    model.train(train)
    total, correct, n = 0.0, 0, 0
    with torch.set_grad_enabled(train):
        for xb, yb in loader:
            xb, yb = xb.to(device), yb.to(device)
            logits = model(xb)
            loss = criterion(logits, yb)
            if train:
                optimizer.zero_grad(set_to_none=True)
                loss.backward()
                optimizer.step()
            total += loss.item() * len(yb); correct += (logits.argmax(1) == yb).sum().item(); n += len(yb)
    return total / n, correct / n

best, bad, patience = float("inf"), 0, 5
for epoch in range(epochs):
    tr_loss, tr_acc = run(train_loader, True)
    va_loss, va_acc = run(val_loader, False)
    scheduler.step()
    print(f"{epoch:3d} train {tr_loss:.4f}/{tr_acc:.3f}  valid {va_loss:.4f}/{va_acc:.3f}")
    if va_loss < best:
        best, bad = va_loss, 0
        torch.save(model.state_dict(), "best.pt")
    elif (bad := bad + 1) >= patience:
        break

model.load_state_dict(torch.load("best.pt", map_location=device))
print("test", run(test_loader, False))`,
    }],
  },
  {
    id: 'nn-sop-transfer', name: 'SOP: Fine-tune a pretrained CNN', section: SECTION, lib: PT,
    flow: ['Load pretrained', 'Replace head', 'Freeze backbone', 'Train head', 'Unfreeze', 'Fine-tune with low LR', 'Test'],
    summary: 'Two-stage transfer learning for image classification with torchvision models.',
    use: 'Image tasks with hundreds to tens of thousands of labeled images.',
    keywords: 'sop workflow transfer learning fine tune pretrained resnet freeze unfreeze backbone head torchvision',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Load', '`models.resnet50(weights="DEFAULT")`; use `weights.transforms()` for preprocessing', 'Inputs must match the pretrained normalization and size.'],
        ['2. Head', 'Replace `model.fc` (or `classifier`) with `nn.Linear(in_features, n_classes)`', ''],
        ['3. Freeze', '`requires_grad_(False)` on the backbone', 'BatchNorm layers still update running stats in `train()` mode.'],
        ['4. Train head', 'LR 1e-3, a few epochs', ''],
        ['5. Unfreeze', 'Unfreeze all (or the last blocks)', ''],
        ['6. Fine-tune', 'LR 1e-4–1e-5 for the backbone, ~10× higher for the head; early stopping', 'A high LR destroys pretrained features.'],
        ['7. Test', 'Best checkpoint on test', ''],
      ],
    }],
    snippets: [{
      title: 'Two-stage fine-tuning',
      code: `from torchvision import models
weights = models.ResNet50_Weights.DEFAULT
model = models.resnet50(weights=weights)
preprocess = weights.transforms()
model.fc = nn.Linear(model.fc.in_features, n_classes)

# Stage 1: head only
for p in model.parameters(): p.requires_grad_(False)
for p in model.fc.parameters(): p.requires_grad_(True)
optimizer = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)
# ... train 3–5 epochs ...

# Stage 2: everything, discriminative learning rates
for p in model.parameters(): p.requires_grad_(True)
backbone = [p for n, p in model.named_parameters() if not n.startswith("fc.")]
optimizer = torch.optim.AdamW([
    {"params": backbone, "lr": 1e-5},
    {"params": model.fc.parameters(), "lr": 1e-4},
], weight_decay=1e-2)
# ... train with early stopping ...`,
    }],
  },
  {
    id: 'nn-sop-text-hf', name: 'SOP: Fine-tune a transformer for text', section: SECTION, lib: HF,
    flow: ['Load dataset', 'Tokenize', 'Pretrained model + head', 'TrainingArguments', 'Trainer.train', 'Evaluate', 'Test + save'],
    summary: 'Text classification with Hugging Face Transformers and the Trainer API.',
    use: 'When TF-IDF baselines are not enough and you have a GPU; a few thousand labeled texts are usually plenty.',
    keywords: 'sop workflow hugging face transformers bert fine tune trainer tokenizer nlp text classification',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Data', '`datasets.Dataset.from_pandas` or `load_dataset`; split train / valid / test', ''],
        ['2. Tokenize', '`AutoTokenizer`, `truncation=True`, `max_length` 128–512', 'Pad dynamically with `DataCollatorWithPadding`, not to max length.'],
        ['3. Model', '`AutoModelForSequenceClassification(num_labels=…)`', 'Pick a small model first (distilbert, MiniLM).'],
        ['4. Arguments', 'lr 2e-5–5e-5, 2–4 epochs, batch 16–32, `weight_decay=0.01`, warmup 0.06–0.1', ''],
        ['5. Train', '`Trainer(...).train()` with `load_best_model_at_end=True`', 'Use `fp16`/`bf16` on GPU.'],
        ['6. Evaluate', '`compute_metrics` returns accuracy / F1 per epoch', ''],
        ['7. Test + save', '`trainer.predict(test)`; `save_pretrained` model and tokenizer', ''],
      ],
    }],
    snippets: [{
      title: 'Trainer fine-tuning',
      code: `# pip install transformers datasets evaluate accelerate
import numpy as np
from datasets import Dataset
from transformers import (AutoTokenizer, AutoModelForSequenceClassification,
                          DataCollatorWithPadding, TrainingArguments, Trainer)
from sklearn.metrics import f1_score

name = "distilbert-base-uncased"
tok = AutoTokenizer.from_pretrained(name)
ds = {k: Dataset.from_pandas(v).map(lambda b: tok(b["text"], truncation=True, max_length=256), batched=True)
      for k, v in {"train": train_df, "valid": val_df, "test": test_df}.items()}

model = AutoModelForSequenceClassification.from_pretrained(name, num_labels=n_labels)

def compute_metrics(p):
    preds = np.argmax(p.predictions, axis=-1)
    return {"f1": f1_score(p.label_ids, preds, average="macro")}

args = TrainingArguments("out", learning_rate=2e-5, per_device_train_batch_size=16, num_train_epochs=3,
                         weight_decay=0.01, warmup_ratio=0.1, eval_strategy="epoch", save_strategy="epoch",
                         load_best_model_at_end=True, metric_for_best_model="f1", fp16=True)
trainer = Trainer(model=model, args=args, train_dataset=ds["train"], eval_dataset=ds["valid"],
                  data_collator=DataCollatorWithPadding(tok), compute_metrics=compute_metrics)
trainer.train()
print(trainer.predict(ds["test"]).metrics)
trainer.save_model("model"); tok.save_pretrained("model")`,
    }],
    tips: ['The dataset needs a `label` column with integer ids.', '`eval_strategy` was called `evaluation_strategy` before Transformers 4.41.'],
  },
  {
    id: 'nn-sop-tabular', name: 'SOP: Neural network for tabular data', section: SECTION, lib: PT,
    flow: ['Split', 'Scale numerics', 'Embed categoricals', 'MLP', 'AdamW + OneCycle', 'Early stop', 'Compare with GBM'],
    summary: 'An MLP with categorical embeddings: the usual deep baseline for tables.',
    use: 'Large tables, multi-task outputs, or when the model must be combined with images/text. Boosted trees usually win on small tables.',
    keywords: 'sop workflow tabular mlp embedding categorical scaling pytorch',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'Same splits as your GBM baseline', 'So the comparison is fair.'],
        ['2. Numerics', 'Impute, then `StandardScaler` or `QuantileTransformer(output_distribution="normal")` (fit on train)', 'Unscaled inputs make training unstable.'],
        ['3. Categoricals', 'Map to ids (reserve 0 for unknown), `nn.Embedding(n, min(50, (n + 1) // 2))`', ''],
        ['4. Model', '2–4 Linear layers of 128–512, BatchNorm/LayerNorm, ReLU/SiLU, Dropout 0.1–0.3', ''],
        ['5. Optimize', '`AdamW`, `OneCycleLR(max_lr=1e-3…3e-3)`, batch 256–1024', ''],
        ['6. Early stop', 'Patience 10–20 epochs on valid metric', ''],
        ['7. Compare', 'Against LightGBM / CatBoost; try averaging both', 'Ensembles of NN + GBM often beat either alone.'],
      ],
    }],
    snippets: [{
      title: 'MLP with embeddings',
      code: `class TabularNet(nn.Module):
    def __init__(self, cardinalities, n_num, hidden=256, n_out=1, p=0.2):
        super().__init__()
        self.embs = nn.ModuleList(nn.Embedding(c + 1, min(50, (c + 1) // 2)) for c in cardinalities)
        d = sum(e.embedding_dim for e in self.embs) + n_num
        self.mlp = nn.Sequential(
            nn.Linear(d, hidden), nn.BatchNorm1d(hidden), nn.SiLU(), nn.Dropout(p),
            nn.Linear(hidden, hidden), nn.BatchNorm1d(hidden), nn.SiLU(), nn.Dropout(p),
            nn.Linear(hidden, n_out),
        )

    def forward(self, x_cat, x_num):
        x = torch.cat([emb(x_cat[:, i]) for i, emb in enumerate(self.embs)] + [x_num], dim=1)
        return self.mlp(x)`,
    }],
  },
  {
    id: 'nn-sop-sequence', name: 'SOP: Sequence / time-series model', section: SECTION, lib: PT,
    flow: ['Chronological split', 'Normalize with train stats', 'Sliding windows', 'LSTM / GRU / 1D-CNN', 'Validate on later period', 'Compare with naive', 'Test'],
    summary: 'Forecast or classify from windows of a time series.',
    use: 'Long or multivariate series where tabular lag features are not enough.',
    keywords: 'sop workflow lstm gru sequence time series window forecast normalize',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'By time: train < valid < test', 'Shuffled splits leak the future.'],
        ['2. Normalize', 'Mean/std from train only, applied to all splits', ''],
        ['3. Windows', '`(lookback, features)` → target at `t + horizon`', 'Windows may shuffle inside the training set; the split itself may not.'],
        ['4. Model', '`nn.LSTM(batch_first=True)` → last hidden state → `nn.Linear`', 'Clip gradients (`max_norm=1.0`).'],
        ['5. Validate', 'Early stopping on the valid period', ''],
        ['6. Naive', 'Compare to last value / seasonal naive', 'Deep models often fail to beat it on short series.'],
        ['7. Test', 'Score the latest period, invert the normalization', ''],
      ],
    }],
    snippets: [{
      title: 'Windows + LSTM',
      code: `def windows(series, lookback, horizon):
    X, y = [], []
    for t in range(lookback, len(series) - horizon + 1):
        X.append(series[t - lookback:t]); y.append(series[t + horizon - 1, 0])
    return torch.tensor(np.array(X), dtype=torch.float32), torch.tensor(np.array(y), dtype=torch.float32)

mu, sd = train_arr.mean(0), train_arr.std(0) + 1e-8
X_tr, y_tr = windows((train_arr - mu) / sd, 48, 1)
X_va, y_va = windows((val_arr - mu) / sd, 48, 1)

class Forecaster(nn.Module):
    def __init__(self, n_feat, hidden=64):
        super().__init__()
        self.rnn = nn.LSTM(n_feat, hidden, num_layers=2, batch_first=True, dropout=0.1)
        self.head = nn.Linear(hidden, 1)

    def forward(self, x):
        out, _ = self.rnn(x)
        return self.head(out[:, -1]).squeeze(-1)`,
    }],
  },
  {
    id: 'nn-sop-tuning', name: 'SOP: Tune a network', section: SECTION, lib: [PT, KR],
    flow: ['Overfit one batch', 'LR range test', 'Max batch that fits', 'Add regularization', 'Schedule', 'Search (Optuna)'],
    summary: 'The order in which to tune deep-learning hyperparameters.',
    use: 'When the first run trains but the validation metric is not good enough.',
    keywords: 'sop workflow tune hyperparameter learning rate finder batch size regularization overfit one batch optuna',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Overfit one batch', 'Train on ~32 samples until loss ≈ 0', 'If it cannot, there is a bug (labels, loss, shapes), not a tuning problem.'],
        ['2. LR range test', 'Increase LR exponentially over a few hundred steps; pick ~1/10 of where loss explodes', 'The learning rate is the most important hyperparameter.'],
        ['3. Batch size', 'Largest that fits in memory; scale LR roughly linearly with batch size', ''],
        ['4. Regularize', 'Weight decay, dropout, augmentation, more data — only once training loss is low', 'Regularizing an underfit model makes it worse.'],
        ['5. Schedule', 'Warmup + cosine, or OneCycle', ''],
        ['6. Search', 'Optuna over lr (log), weight decay (log), dropout, width, with pruning', 'Keep budgets short (few epochs) and confirm the winner with a full run.'],
      ],
    }],
    snippets: [{
      title: 'LR range test',
      code: `import math, itertools
lrs, losses = [], []
lr, lr_end, steps = 1e-7, 10, 200
factor = (lr_end / lr) ** (1 / steps)
model.train()
for i, (xb, yb) in zip(range(steps), itertools.cycle(train_loader)):
    for g in optimizer.param_groups: g["lr"] = lr
    loss = criterion(model(xb.to(device)), yb.to(device))
    optimizer.zero_grad(); loss.backward(); optimizer.step()
    lrs.append(lr); losses.append(loss.item())
    if not math.isfinite(loss.item()) or loss.item() > 4 * min(losses): break
    lr *= factor
plt.semilogx(lrs, losses)   # reload the initial weights afterwards`,
    }],
  },
  {
    id: 'nn-sop-keras', name: 'SOP: Keras workflow', section: SECTION, lib: KR,
    flow: ['Prepare arrays / tf.data', 'Build model', 'compile', 'fit + callbacks', 'evaluate', 'save .keras'],
    summary: 'The same supervised workflow in Keras 3, with callbacks doing early stopping and checkpointing.',
    use: 'Quick experiments and standard architectures with minimal boilerplate.',
    keywords: 'sop workflow keras compile fit evaluate callbacks early stopping save',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Data', 'NumPy arrays or `tf.data.Dataset`; `layers.Normalization().adapt(X_train)`', 'Adapt normalization on train only.'],
        ['2. Build', '`keras.Sequential` or functional API', ''],
        ['3. Compile', 'Optimizer, loss, metrics', 'Use `from_logits=True` if the last layer has no activation.'],
        ['4. Fit', '`validation_data=(X_val, y_val)`, `EarlyStopping(restore_best_weights=True)`, `ModelCheckpoint`', '`validation_split` takes the last rows, not a random sample.'],
        ['5. Evaluate', '`model.evaluate(X_test, y_test)` once', ''],
        ['6. Save', '`model.save("model.keras")`; `keras.models.load_model`', ''],
      ],
    }],
    snippets: [{
      title: 'Keras end to end',
      code: `import keras
from keras import layers

norm = layers.Normalization(); norm.adapt(X_train)
model = keras.Sequential([
    keras.Input(shape=(X_train.shape[1],)), norm,
    layers.Dense(256, activation="relu"), layers.Dropout(0.2),
    layers.Dense(128, activation="relu"), layers.Dropout(0.2),
    layers.Dense(n_classes),
])
model.compile(optimizer=keras.optimizers.AdamW(1e-3),
              loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True), metrics=["accuracy"])
history = model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=100, batch_size=256,
                    callbacks=[keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
                               keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=4)])
print(model.evaluate(X_test, y_test))
model.save("model.keras")`,
    }],
  },
  {
    id: 'nn-sop-tensorflow', name: 'SOP: TensorFlow pipeline', section: SECTION, lib: KR,
    flow: ['tf.data pipeline', 'Build model', 'compile + fit', 'Custom loop (optional)', 'evaluate', 'export SavedModel / TFLite'],
    summary: 'Input pipeline, Keras model, optional GradientTape loop, then export for serving.',
    use: 'Production-minded TensorFlow work where throughput and deployment matter.',
    keywords: 'sop workflow tensorflow tf.data gradienttape savedmodel tflite distribute',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Data', '`tf.data`: `shuffle` → `map(num_parallel_calls=AUTOTUNE)` → `batch` → `prefetch(AUTOTUNE)`', 'Shuffle only the training set; keep augmentation after `cache`.'],
        ['2. Build', 'Functional API, or `keras.applications` backbone with `include_top=False`', 'Pass `training=False` to a frozen backbone so BatchNorm stays in inference mode.'],
        ['3. Compile + fit', '`EarlyStopping`, `ModelCheckpoint`, `TensorBoard` callbacks; `strategy.scope()` for multi-GPU', 'Create model and optimizer inside the strategy scope.'],
        ['4. Custom loop', '`@tf.function` train step with `GradientTape` when `fit` is not enough', 'Python side effects run only while tracing.'],
        ['5. Evaluate', '`model.evaluate(test_ds)` once', 'Test set not shuffled and not augmented.'],
        ['6. Export', '`model.export(dir)` → TF Serving; `TFLiteConverter` for mobile', 'Check TFLite output against the Keras output on a few samples.'],
      ],
    }],
    snippets: [{
      title: 'TensorFlow end to end',
      code: `import tensorflow as tf
from tensorflow import keras

AUTOTUNE = tf.data.AUTOTUNE
train_ds = (tf.data.Dataset.from_tensor_slices((X_train, y_train))
            .shuffle(10_000).batch(64).prefetch(AUTOTUNE))
val_ds = tf.data.Dataset.from_tensor_slices((X_val, y_val)).batch(256).prefetch(AUTOTUNE)
test_ds = tf.data.Dataset.from_tensor_slices((X_test, y_test)).batch(256)

norm = keras.layers.Normalization(); norm.adapt(X_train)          # statistics from train only
model = keras.Sequential([
    keras.Input((X_train.shape[1],)), norm,
    keras.layers.Dense(128, activation='relu'), keras.layers.Dropout(0.2),
    keras.layers.Dense(n_classes),
])
model.compile(optimizer=keras.optimizers.Adam(1e-3),
              loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True), metrics=['accuracy'])
model.fit(train_ds, validation_data=val_ds, epochs=50, callbacks=[
    keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
    keras.callbacks.ModelCheckpoint('best.keras', save_best_only=True),
    keras.callbacks.TensorBoard('logs'),
])

print(model.evaluate(test_ds))                                    # once
model.export('export/saved_model')                                # TF Serving
tflite = tf.lite.TFLiteConverter.from_saved_model('export/saved_model').convert()
open('model.tflite', 'wb').write(tflite)`,
    }],
  },
  {
    id: 'nn-sop-deploy', name: 'SOP: Inference & export', section: SECTION, lib: PT,
    flow: ['Load best weights', 'model.eval()', 'inference_mode', 'Batch predict', 'Export (ONNX / TorchScript)', 'Verify outputs'],
    summary: 'Turn a trained PyTorch model into a reliable predictor or an exported artifact.',
    use: 'After training, for batch scoring, serving, or running outside Python.',
    keywords: 'sop workflow inference deploy export onnx torchscript eval inference_mode predict',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Load', 'Rebuild the model class, `load_state_dict(torch.load(..., map_location=device))`', ''],
        ['2. Eval mode', '`model.eval()`', 'Dropout and BatchNorm behave differently otherwise.'],
        ['3. No grad', '`with torch.inference_mode():`', 'Saves memory and time.'],
        ['4. Predict', 'Same preprocessing as validation (no augmentation)', ''],
        ['5. Export', '`torch.onnx.export` or `torch.export` / TorchScript', 'Mark the batch axis as dynamic.'],
        ['6. Verify', 'Compare exported vs PyTorch outputs with `np.allclose(atol=1e-4)`', ''],
      ],
    }],
    snippets: [{
      title: 'Predict and export to ONNX',
      code: `model = Net(); model.load_state_dict(torch.load("best.pt", map_location="cpu")); model.eval()
with torch.inference_mode():
    probs = torch.cat([model(xb).softmax(-1) for xb, _ in test_loader])

dummy = torch.randn(1, *input_shape)
torch.onnx.export(model, dummy, "model.onnx", input_names=["x"], output_names=["logits"],
                  dynamic_axes={"x": {0: "batch"}, "logits": {0: "batch"}})

import onnxruntime as ort, numpy as np
sess = ort.InferenceSession("model.onnx")
out = sess.run(None, {"x": dummy.numpy()})[0]
assert np.allclose(out, model(dummy).detach().numpy(), atol=1e-4)`,
    }],
  },
]

export const dataWorkflows = [
  {
    id: 'sop-eda', name: 'SOP: Exploratory data analysis', section: SECTION, lib: PD,
    flow: ['Load', 'Shape & dtypes', 'Missing & duplicates', 'Univariate', 'vs target', 'Correlations', 'Write findings'],
    summary: 'A repeatable first look at a new dataset before any modeling.',
    use: 'Every new dataset. Do it on the training split if you will model later.',
    keywords: 'sop workflow eda explore inspect missing duplicates distribution correlation target',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Load', '`read_csv` / `read_parquet` with explicit dtypes and dates', ''],
        ['2. Structure', '`shape`, `info()`, `head()`, `nunique()`', 'Numbers stored as text, IDs read as numbers.'],
        ['3. Quality', '`isna().mean()`, `duplicated().sum()`, impossible values', 'Missingness that depends on the target is a signal (and a leak risk).'],
        ['4. Univariate', '`describe()`, histograms, `value_counts()`', 'Skew, outliers, rare categories.'],
        ['5. vs target', 'Grouped means / box plots / target rate per category', 'Features that are “too good” are often leaks.'],
        ['6. Correlations', '`corr()` heatmap, pair plots on a sample', ''],
        ['7. Findings', 'List cleaning steps and feature ideas', ''],
      ],
    }],
    snippets: [{
      title: 'EDA in one cell',
      code: `import pandas as pd, matplotlib.pyplot as plt, seaborn as sns
df = pd.read_csv("data.csv", parse_dates=["date"])
print(df.shape); df.info()
display(df.head())
display(pd.DataFrame({"dtype": df.dtypes, "missing": df.isna().mean().round(3),
                      "unique": df.nunique()}).sort_values("missing", ascending=False))
print("duplicates:", df.duplicated().sum())
display(df.describe(include="all").T)

num = df.select_dtypes("number").columns
df[num].hist(bins=40, figsize=(14, 10)); plt.tight_layout()
sns.heatmap(df[num].corr(), cmap="coolwarm", center=0); plt.show()

for col in df.select_dtypes(["object", "category"]):
    display(df.groupby(col)["target"].agg(["mean", "count"]).sort_values("count", ascending=False).head(10))`,
    }],
  },
  {
    id: 'sop-cleaning', name: 'SOP: Data cleaning', section: SECTION, lib: PD,
    flow: ['Standardize columns', 'Fix dtypes', 'Drop duplicates', 'Handle missing', 'Handle outliers', 'Validate', 'Save parquet'],
    summary: 'Turn a raw extract into a clean, typed table you can trust.',
    use: 'After EDA, as a reusable function so the same steps run on new data.',
    keywords: 'sop workflow clean cleaning dtypes duplicates missing outliers validate parquet',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Columns', 'snake_case names, strip whitespace', ''],
        ['2. Dtypes', '`to_numeric(errors="coerce")`, `to_datetime`, `astype("category")`', 'Coercion turns bad values into NaN — count them.'],
        ['3. Duplicates', '`drop_duplicates(subset=keys)`', 'Decide which duplicate to keep (latest?).'],
        ['4. Missing', 'Drop columns with > ~60% missing; leave the rest for the model pipeline imputer', 'Imputing before the split leaks statistics.'],
        ['5. Outliers', 'Fix impossible values (negative ages) to NaN; clip extreme ones only with a reason', ''],
        ['6. Validate', '`assert` key uniqueness, ranges, and row counts', ''],
        ['7. Save', '`to_parquet` keeps dtypes', ''],
      ],
    }],
    snippets: [{
      title: 'Cleaning function',
      code: `def clean(raw: pd.DataFrame) -> pd.DataFrame:
    df = raw.copy()
    df.columns = df.columns.str.strip().str.lower().str.replace(r"\\W+", "_", regex=True)
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["city"] = df["city"].str.strip().str.title().astype("category")
    df = df.sort_values("date").drop_duplicates(subset=["order_id"], keep="last")
    df.loc[df["age"].lt(0) | df["age"].gt(120), "age"] = pd.NA
    df = df.loc[:, df.isna().mean() < 0.6]
    assert df["order_id"].is_unique
    assert df["amount"].dropna().ge(0).all()
    return df

df = clean(pd.read_csv("raw.csv"))
df.to_parquet("clean.parquet", index=False)`,
    }],
  },
  {
    id: 'sop-feature-eng', name: 'SOP: Feature engineering', section: SECTION, lib: [PD, SK],
    flow: ['Split first', 'Date parts', 'Group aggregates', 'Ratios & interactions', 'Encode', 'Leakage check', 'Validate gain with CV'],
    summary: 'Common feature recipes and the order to apply them without leaking.',
    use: 'Tabular projects after a baseline exists, so you can measure each feature’s gain.',
    keywords: 'sop workflow feature engineering aggregate groupby transform date ratio encoding leakage',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Split', 'Split before computing any statistic that uses many rows', 'Group aggregates over all rows leak test labels/values.'],
        ['2. Dates', 'year, month, dayofweek, hour, is_weekend, days since event', ''],
        ['3. Aggregates', '`groupby(key)[col].transform("mean")` computed on train, merged to valid/test', 'For time data, aggregate only the past (`expanding().mean().shift()`).'],
        ['4. Ratios', 'price per unit, debt / income, differences', 'Trees struggle to learn ratios themselves.'],
        ['5. Encode', 'One-hot (low cardinality), target / CatBoost encoding (high)', 'Target encoding must be cross-fitted (`TargetEncoder` does it).'],
        ['6. Leakage check', 'Is each feature available at prediction time?', 'IDs, post-event timestamps, and status columns are classic leaks.'],
        ['7. Validate', 'Keep a feature only if CV improves beyond noise', ''],
      ],
    }],
    snippets: [{
      title: 'Feature recipes',
      code: `def add_features(df, stats=None):
    df = df.copy()
    df["month"] = df["date"].dt.month
    df["dow"] = df["date"].dt.dayofweek
    df["is_weekend"] = df["dow"].ge(5).astype(int)
    df["price_per_unit"] = df["amount"] / df["qty"].replace(0, np.nan)
    if stats is None:   # fit on train only
        stats = df.groupby("customer_id")["amount"].agg(cust_mean="mean", cust_count="count")
    df = df.join(stats, on="customer_id")
    return df, stats

train_f, stats = add_features(train)
test_f, _ = add_features(test, stats)   # reuse train statistics`,
    }],
  },
  {
    id: 'sop-leakage', name: 'SOP: Leakage checklist', section: SECTION, lib: [PD, SK],
    flow: ['Split strategy', 'Fit-on-train only', 'Feature timing', 'Duplicates', 'Too-good check'],
    summary: 'Questions to ask before trusting a validation score.',
    use: 'Before reporting any result, and whenever a score looks surprisingly high.',
    keywords: 'sop workflow leakage leak checklist validation trust duplicates time group',
    tables: [{
      title: 'Checklist', head: ['Check', 'Question', 'Fix'],
      rows: [
        ['Split', 'Do rows from the same user / patient / time period appear in both train and test?', '`GroupKFold`, `TimeSeriesSplit`, time-based holdout.'],
        ['Preprocessing', 'Was any scaler, imputer, encoder, or selector fitted before the split?', 'Put every fitted step in a `Pipeline`.'],
        ['Feature timing', 'Would this value be known at prediction time?', 'Drop or lag the feature.'],
        ['Target proxies', 'Does a feature encode the label (status codes, “closed_reason”)?', 'Drop it; check top feature importances.'],
        ['Duplicates', 'Are there exact or near duplicates across splits?', 'Deduplicate before splitting.'],
        ['Tuning on test', 'Was the test set used to choose anything?', 'Use a validation set or CV for every choice.'],
        ['Too good', 'Is the score far above the published / domain baseline?', 'Assume a leak until proven otherwise.'],
      ],
    }],
  },
  {
    id: 'sop-ab-test', name: 'SOP: A/B test analysis', section: SECTION, lib: ['SciPy', PD],
    flow: ['Define metric', 'Check sample ratio', 'Choose test', 'Effect + CI', 'Decide'],
    summary: 'Compare two groups on a conversion rate or a continuous metric.',
    use: 'Experiments, before/after comparisons with randomization.',
    keywords: 'sop workflow ab test experiment hypothesis t-test chi2 proportion confidence interval p-value srm',
    tables: [{
      title: 'Steps', head: stepHead,
      rows: [
        ['1. Metric', 'One primary metric fixed before looking at the data', 'Testing many metrics inflates false positives.'],
        ['2. Sample ratio', 'Chi-square test on group sizes vs the planned split', 'A mismatch (SRM) means the assignment is broken.'],
        ['3. Test', 'Rates: chi-square / two-proportion z-test. Means: Welch t-test. Skewed: Mann–Whitney or bootstrap.', ''],
        ['4. Effect', 'Report the difference and a 95% CI, not only the p-value', ''],
        ['5. Decide', 'Ship if the CI excludes zero and the effect is practically meaningful', 'Do not stop early when p dips below 0.05.'],
      ],
    }],
    snippets: [{
      title: 'Conversion and mean tests',
      code: `from scipy import stats
import numpy as np

# Conversion rate
a = df[df.group == "A"]["converted"]; b = df[df.group == "B"]["converted"]
table = [[a.sum(), len(a) - a.sum()], [b.sum(), len(b) - b.sum()]]
chi2, p, *_ = stats.chi2_contingency(table)
diff = b.mean() - a.mean()
se = np.sqrt(a.mean() * (1 - a.mean()) / len(a) + b.mean() * (1 - b.mean()) / len(b))
print(f"lift {diff:.4f}  95% CI [{diff - 1.96 * se:.4f}, {diff + 1.96 * se:.4f}]  p={p:.4f}")

# Continuous metric (Welch t-test)
t, p = stats.ttest_ind(df_b["revenue"], df_a["revenue"], equal_var=False)

# Sample ratio mismatch (planned 50/50)
print(stats.chisquare([len(a), len(b)]).pvalue)`,
    }],
  },
]
