// Short, copyable snippets for everyday data work.
import { dataWorkflows } from './workflows.js'

const PD = 'pandas'
const NP = 'NumPy'
const PLT = 'Matplotlib'
const SK = 'scikit-learn'
const PY = 'Python'

export const snippetSheet = [
  ...dataWorkflows,

  // pandas
  {
    id: 'pd-load-inspect', name: 'Load & inspect', section: 'pandas', lib: PD, import: 'import pandas as pd',
    summary: 'First look at a new dataset.',
    keywords: 'read_csv head info describe shape dtypes value_counts',
    snippets: [{
      title: 'Inspect',
      code: `df = pd.read_csv("data.csv")
df.shape, df.dtypes
df.head()
df.info()
df.describe(include="all").T
df.isna().mean().sort_values(ascending=False)   # missing share per column
df["target"].value_counts(normalize=True)
df.nunique().sort_values()`,
    }],
  },
  {
    id: 'pd-read-csv', name: 'pd.read_csv', section: 'pandas', lib: PD, import: 'import pandas as pd',
    summary: 'Most useful `read_csv` options.',
    keywords: 'csv read load parse dates encoding chunks',
    params: [
      ['sep', "','", 'str | None', "`'\\t'` for TSV; `None` with `engine='python'` sniffs."],
      ['header', "'infer'", 'int | list | None', 'None when the file has no header row.'],
      ['names', 'None', 'list', 'Column names (with header=None).'],
      ['index_col', 'None', 'int | str | False', ''],
      ['usecols', 'None', 'list | callable', 'Load only needed columns — saves memory.'],
      ['dtype', 'None', 'dict', "e.g. `{'zip': str, 'id': 'int32'}`."],
      ['parse_dates', 'None', 'list', "`['date']` to parse date columns."],
      ['na_values', 'None', 'scalar | list | dict', "Extra strings to treat as NaN, e.g. `['?', 'NA']`."],
      ['nrows', 'None', 'int', 'Read a sample first.'],
      ['skiprows', 'None', 'int | list | callable', ''],
      ['encoding', "'utf-8'", 'str', "`'latin-1'` or `'utf-8-sig'` (BOM) for odd files."],
      ['chunksize', 'None', 'int', 'Iterate over large files in pieces.'],
      ['low_memory', 'True', 'bool', 'False avoids mixed-type warnings.'],
      ['engine', "None ('c')", "'c' | 'python' | 'pyarrow'", '`pyarrow` is much faster for large files.'],
      ['dtype_backend', "'numpy_nullable'", "'numpy_nullable' | 'pyarrow'", 'Pass `pyarrow` for Arrow-backed columns.'],
    ],
  },
  {
    id: 'pd-select-filter', name: 'Select & filter', section: 'pandas', lib: PD,
    summary: 'Rows and columns by label, position, and condition.',
    keywords: 'loc iloc query filter isin between select columns rows',
    snippets: [{
      title: 'Selecting',
      code: `df[["a", "b"]]                         # columns
df.loc[df["age"] > 30, ["name", "age"]] # rows by condition, columns by label
df.iloc[:10, :3]                         # by position
df[df["city"].isin(["Taipei", "Tokyo"])]
df[df["price"].between(10, 100)]
df.query("age > 30 and city == 'Taipei'")
df.select_dtypes(include="number")
df.filter(like="score_")                 # columns containing text
df.nlargest(5, "price")`,
    }],
  },
  {
    id: 'pd-clean', name: 'Clean & transform', section: 'pandas', lib: PD,
    summary: 'Missing values, types, duplicates, and new columns.',
    keywords: 'fillna dropna astype rename drop duplicates assign apply map replace clip',
    snippets: [{
      title: 'Cleaning',
      code: `df = df.drop_duplicates()
df = df.rename(columns=str.lower).rename(columns={"old": "new"})
df["age"] = df["age"].fillna(df["age"].median())
df = df.dropna(subset=["target"])
df["category"] = df["category"].astype("category")
df["price"] = pd.to_numeric(df["price"], errors="coerce")
df["income"] = df["income"].clip(upper=df["income"].quantile(0.99))
df = df.assign(ratio=lambda d: d["a"] / d["b"], log_price=lambda d: np.log1p(d["price"]))
df["size"] = df["size"].map({"S": 0, "M": 1, "L": 2})
df["name"] = df["name"].str.strip().str.lower()`,
    }],
  },
  {
    id: 'pd-groupby', name: 'groupby & aggregate', section: 'pandas', lib: PD,
    summary: 'Split-apply-combine.',
    keywords: 'groupby agg aggregate transform pivot summary',
    snippets: [
      {
        title: 'Named aggregation',
        code: `summary = (df.groupby("city", as_index=False)
             .agg(n=("id", "size"), avg_price=("price", "mean"), max_age=("age", "max"))
             .sort_values("n", ascending=False))`,
      },
      { title: 'Group-wise feature (same length as df)', code: 'df["price_vs_city"] = df["price"] / df.groupby("city")["price"].transform("mean")' },
    ],
    params: [
      ['as_index', 'True', 'bool', 'False keeps group keys as columns.'],
      ['dropna', 'True', 'bool', 'False keeps NaN as a group.'],
      ['observed', 'True (pandas ≥ 3)', 'bool', 'For categorical keys: only show observed combinations.'],
      ['sort', 'True', 'bool', 'False is faster.'],
    ],
  },
  {
    id: 'pd-merge', name: 'merge / join / concat', section: 'pandas', lib: PD,
    summary: 'Combine DataFrames.',
    keywords: 'merge join concat combine left inner outer',
    params: [
      ['how', "'inner'", "'inner' | 'left' | 'right' | 'outer' | 'cross'", '`left` keeps every row of the left table.'],
      ['on', 'None', 'str | list', 'Key columns present in both.'],
      ['left_on / right_on', 'None', 'str | list', 'Keys with different names.'],
      ['suffixes', "('_x', '_y')", 'tuple', 'For overlapping non-key columns.'],
      ['validate', 'None', "'1:1' | '1:m' | 'm:1' | 'm:m'", 'Catch unexpected duplicate keys.'],
      ['indicator', 'False', 'bool', 'Adds `_merge` column showing the source of each row.'],
    ],
    snippets: [{
      title: 'Merge and concat',
      code: `out = orders.merge(customers, on="customer_id", how="left", validate="m:1", indicator=True)
out["_merge"].value_counts()

pd.concat([df_2024, df_2025], ignore_index=True)  # stack rows
pd.concat([X, dummies], axis=1)                    # side by side`,
    }],
  },
  {
    id: 'pd-pivot', name: 'pivot_table / melt / crosstab', section: 'pandas', lib: PD,
    summary: 'Reshape between long and wide.',
    keywords: 'pivot melt crosstab reshape wide long stack unstack',
    params: [
      ['values', 'None', 'column(s)', ''],
      ['index / columns', 'None', 'column(s)', ''],
      ['aggfunc', "'mean'", "str | func | list | dict", "`'sum'`, `'count'`, `'size'`."],
      ['fill_value', 'None', 'scalar', '0 for counts.'],
      ['margins', 'False', 'bool', 'Add row/column totals.'],
    ],
    snippets: [{
      title: 'Reshape',
      code: `wide = df.pivot_table(index="date", columns="product", values="sales", aggfunc="sum", fill_value=0)
long = wide.reset_index().melt(id_vars="date", var_name="product", value_name="sales")
pd.crosstab(df["gender"], df["churn"], normalize="index")`,
    }],
  },
  {
    id: 'pd-datetime', name: 'Dates & time series', section: 'pandas', lib: PD,
    summary: 'Parse, extract, resample, and lag.',
    keywords: 'datetime to_datetime resample rolling shift lag dt time series',
    snippets: [{
      title: 'Time features',
      code: `df["ts"] = pd.to_datetime(df["ts"], errors="coerce")
df["year"], df["month"], df["dow"] = df["ts"].dt.year, df["ts"].dt.month, df["ts"].dt.dayofweek
df["hour"] = df["ts"].dt.hour

s = df.set_index("ts")["sales"].sort_index()
daily = s.resample("D").sum()
weekly_avg = daily.rolling(7, min_periods=1).mean()
df["lag_1"] = df.groupby("store")["sales"].shift(1)       # per-store lag
df["diff"] = df.groupby("store")["sales"].diff()`,
    }],
  },
  {
    id: 'pd-io', name: 'Read & write other formats', section: 'pandas', lib: PD,
    summary: 'Parquet, Excel, JSON, SQL, and clipboard.',
    keywords: 'parquet excel xlsx json jsonl sql database feather pickle clipboard read write io',
    snippets: [{
      title: 'I/O',
      code: `df = pd.read_parquet("data.parquet", columns=["a", "b"])        # pip install pyarrow
df.to_parquet("out.parquet", index=False)                        # keeps dtypes, small, fast

df = pd.read_excel("book.xlsx", sheet_name="Sheet1", skiprows=2)  # pip install openpyxl
sheets = pd.read_excel("book.xlsx", sheet_name=None)             # dict of all sheets
with pd.ExcelWriter("out.xlsx") as xw:
    df.to_excel(xw, sheet_name="data", index=False)

df = pd.read_json("data.jsonl", lines=True)
flat = pd.json_normalize(records, record_path="items", meta=["id"])
df.to_json("out.jsonl", orient="records", lines=True, force_ascii=False)

import sqlite3
con = sqlite3.connect("db.sqlite")                               # or a SQLAlchemy engine
df = pd.read_sql("SELECT * FROM sales WHERE year = ?", con, params=(2024,))
df.to_sql("sales_clean", con, if_exists="replace", index=False)

df = pd.read_clipboard()                                         # paste from a spreadsheet`,
    }],
  },
  {
    id: 'pd-strings-apply', name: 'Strings, apply & binning', section: 'pandas', lib: PD,
    summary: 'Vectorized string methods, row-wise logic, ranks, and bins.',
    keywords: 'str contains extract split replace regex apply map np.select cut qcut rank explode',
    snippets: [{
      title: 'Strings and conditional columns',
      code: `s = df["email"].str.lower().str.strip()
df["domain"] = s.str.split("@").str[1]
df["has_promo"] = df["text"].str.contains(r"\\bpromo\\b", case=False, na=False)
df[["area", "number"]] = df["phone"].str.extract(r"\\((\\d+)\\)\\s*(\\d+)")
df["tags"] = df["tags"].str.split(","); df = df.explode("tags")

# Conditions: prefer np.select over apply(axis=1)
df["tier"] = np.select([df["spend"] > 1000, df["spend"] > 100], ["gold", "silver"], default="bronze")

df["age_bin"] = pd.cut(df["age"], bins=[0, 18, 35, 60, 120], labels=["<18", "18-35", "35-60", "60+"])
df["spend_q"] = pd.qcut(df["spend"], q=4, labels=False)          # quartiles 0–3
df["rank_in_store"] = df.groupby("store")["sales"].rank(ascending=False, method="dense")`,
    }],
  },
  {
    id: 'pd-performance', name: 'Memory & speed', section: 'pandas', lib: PD,
    summary: 'Make large DataFrames fit in memory and run faster.',
    keywords: 'memory usage downcast category chunksize performance vectorize large data pyarrow speed',
    snippets: [{
      title: 'Shrink and stream',
      code: `df.memory_usage(deep=True).sum() / 1e6                          # MB

for c in df.select_dtypes("object"):
    if df[c].nunique() / len(df) < 0.5:
        df[c] = df[c].astype("category")
for c in df.select_dtypes("float"):
    df[c] = pd.to_numeric(df[c], downcast="float")
for c in df.select_dtypes("integer"):
    df[c] = pd.to_numeric(df[c], downcast="integer")

# Read only what you need, in chunks
usecols = ["id", "date", "amount"]
parts = [chunk.groupby("id")["amount"].sum()
         for chunk in pd.read_csv("big.csv", usecols=usecols, chunksize=1_000_000)]
total = pd.concat(parts).groupby(level=0).sum()

df = pd.read_csv("big.csv", engine="pyarrow", dtype_backend="pyarrow")   # faster parsing`,
    }],
    tips: ['Vectorized column operations beat `apply(axis=1)` by 10–100×.', 'For data larger than memory, try Polars or DuckDB.'],
  },

  // NumPy
  {
    id: 'np-basics', name: 'NumPy essentials', section: 'NumPy', lib: NP, import: 'import numpy as np',
    summary: 'Arrays, random numbers, and common operations.',
    keywords: 'array random rng reshape axis broadcasting where argmax',
    snippets: [{
      title: 'Essentials',
      code: `rng = np.random.default_rng(42)          # modern RNG
a = rng.normal(0, 1, size=(100, 3))
b = rng.integers(0, 10, size=5)
idx = rng.permutation(len(a))

a.mean(axis=0), a.std(axis=0)             # per column
a[a[:, 0] > 0]                            # boolean mask
np.where(a > 0, a, 0)                     # vectorized if/else
np.argmax(a, axis=1)
np.clip(a, -1, 1)
np.concatenate([a, a], axis=0); np.stack([b, b])
a.reshape(-1, 1)                          # column vector
(a - a.mean(0)) / a.std(0)                # broadcasting standardize
np.percentile(a, [5, 50, 95], axis=0)`,
    }],
  },

  // Visualization
  {
    id: 'plt-basics', name: 'Matplotlib basics', section: 'Visualization', lib: PLT, import: 'import matplotlib.pyplot as plt',
    summary: 'Subplots, common chart types, and saving.',
    keywords: 'plot chart subplots scatter histogram line savefig figure',
    snippets: [{
      title: 'Grid of plots',
      code: `fig, axes = plt.subplots(1, 3, figsize=(15, 4))
axes[0].hist(df["age"], bins=30)
axes[0].set_title("Age")
axes[1].scatter(df["x"], df["y"], s=8, alpha=0.5, c=df["label"], cmap="viridis")
axes[2].plot(history["loss"], label="train"); axes[2].plot(history["val_loss"], label="val")
axes[2].legend(); axes[2].set_xlabel("epoch")
fig.tight_layout()
fig.savefig("plots.png", dpi=150, bbox_inches="tight")`,
    }],
  },
  {
    id: 'plt-ml', name: 'ML plots', section: 'Visualization', lib: [PLT, SK],
    import: 'from sklearn.metrics import ConfusionMatrixDisplay, RocCurveDisplay, PrecisionRecallDisplay',
    summary: 'Confusion matrix, ROC / PR curves, correlation heatmap, learning curve.',
    keywords: 'confusion matrix roc pr curve heatmap correlation learning curve seaborn',
    snippets: [
      { title: 'Evaluation displays', code: 'ConfusionMatrixDisplay.from_estimator(model, X_test, y_test, normalize="true", cmap="Blues")\nRocCurveDisplay.from_estimator(model, X_test, y_test)\nPrecisionRecallDisplay.from_estimator(model, X_test, y_test)\nplt.show()' },
      { title: 'Correlation heatmap', code: 'import seaborn as sns\ncorr = df.select_dtypes("number").corr()\nsns.heatmap(corr, cmap="coolwarm", center=0, annot=False)' },
      {
        title: 'Learning curve',
        code: `from sklearn.model_selection import LearningCurveDisplay
LearningCurveDisplay.from_estimator(model, X, y, cv=5, scoring="accuracy",
                                    train_sizes=np.linspace(0.1, 1.0, 5), n_jobs=-1)`,
      },
    ],
  },
  {
    id: 'sns-plots', name: 'Seaborn plots', section: 'Visualization', lib: 'seaborn', import: 'import seaborn as sns',
    summary: 'Statistical charts straight from a DataFrame.',
    keywords: 'seaborn histplot boxplot violin countplot scatterplot pairplot heatmap barplot kde distribution',
    tables: [{
      title: 'Which plot',
      head: ['Question', 'Plot', 'Notes'],
      rows: [
        ['Distribution of one numeric', '`sns.histplot(df, x="age", kde=True)`', '`hue=` to compare groups.'],
        ['Numeric by category', '`sns.boxplot(df, x="cat", y="value")`', '`violinplot` for shape; `stripplot` for raw points.'],
        ['Counts per category', '`sns.countplot(df, y="cat", order=df["cat"].value_counts().index)`', ''],
        ['Mean with CI', '`sns.barplot(df, x="cat", y="value")`', 'Bars show the mean and a 95% CI.'],
        ['Two numerics', '`sns.scatterplot(df, x="a", y="b", hue="label")`', '`regplot` adds a fit line.'],
        ['All pairs', '`sns.pairplot(df.sample(1000), hue="label")`', 'Sample first; it is slow.'],
        ['Matrix', '`sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", center=0)`', ''],
        ['Over time', '`sns.lineplot(df, x="date", y="value", hue="group")`', ''],
      ],
    }],
    snippets: [{ title: 'Grid of distributions', code: 'sns.set_theme(style="whitegrid")\ng = sns.displot(df, x="value", col="group", hue="label", kind="kde", fill=True, col_wrap=3)\ng.savefig("dist.png", dpi=150)' }],
  },

  // Statistical tests
  {
    id: 'scipy-stats', name: 'Statistical tests (SciPy)', section: 'Statistical tests', lib: 'SciPy', import: 'from scipy import stats',
    summary: 'Which test to use, and the one-line call for each.',
    keywords: 'statistics hypothesis test t-test ttest chi2 mann whitney anova pearson spearman normality shapiro p-value',
    tables: [{
      title: 'Choosing a test',
      head: ['Question', 'Test', 'Call'],
      rows: [
        ['Two group means (independent)', 'Welch t-test', '`stats.ttest_ind(a, b, equal_var=False)`'],
        ['Two group medians / skewed data', 'Mann–Whitney U', '`stats.mannwhitneyu(a, b)`'],
        ['Before / after on the same units', 'Paired t-test / Wilcoxon', '`stats.ttest_rel(x, y)` / `stats.wilcoxon(x, y)`'],
        ['3+ group means', 'One-way ANOVA / Kruskal–Wallis', '`stats.f_oneway(a, b, c)` / `stats.kruskal(a, b, c)`'],
        ['Two categorical variables', 'Chi-square', '`stats.chi2_contingency(pd.crosstab(df.x, df.y))`'],
        ['Small 2×2 table', 'Fisher exact', '`stats.fisher_exact(table)`'],
        ['Linear correlation', 'Pearson', '`stats.pearsonr(x, y)`'],
        ['Monotonic correlation', 'Spearman', '`stats.spearmanr(x, y)`'],
        ['Is it normal?', 'Shapiro–Wilk / Q–Q plot', '`stats.shapiro(x)` (n < 5000); `stats.probplot(x, plot=plt)`'],
        ['Same distribution?', 'Kolmogorov–Smirnov', '`stats.ks_2samp(a, b)` (also a quick drift check)'],
      ],
    }],
    snippets: [{ title: 'Bootstrap confidence interval', code: 'import numpy as np\nres = stats.bootstrap((a, b), lambda x, y: np.mean(x) - np.mean(y), n_resamples=5000,\n                      vectorized=False, random_state=0)\nres.confidence_interval   # 95% CI of the mean difference' }],
    tips: ['With many tests, correct p-values: `from statsmodels.stats.multitest import multipletests`.', 'Report effect sizes and intervals, not just p-values.'],
  },

  // scikit-learn workflow
  {
    id: 'sk-end-to-end', name: 'End-to-end tabular model', section: 'ML workflow', lib: SK,
    summary: 'Load → split → pipeline → CV → test → save.',
    keywords: 'workflow template pipeline full example baseline',
    snippets: [{
      title: 'Template',
      code: `import pandas as pd, numpy as np, joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.compose import ColumnTransformer, make_column_selector as sel
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score

df = pd.read_csv("data.csv")
X, y = df.drop(columns="target"), df["target"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

pre = ColumnTransformer([
    ("num", SimpleImputer(strategy="median"), sel(dtype_include="number")),
    ("cat", make_pipeline(SimpleImputer(strategy="most_frequent"),
                          OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
     sel(dtype_include=["object", "category"])),
])
model = make_pipeline(pre, HistGradientBoostingClassifier(random_state=42))

scores = cross_val_score(model, X_train, y_train, cv=5, scoring="roc_auc", n_jobs=-1)
print(f"CV AUC {scores.mean():.3f} ± {scores.std():.3f}")

model.fit(X_train, y_train)
proba = model.predict_proba(X_test)[:, 1]
print("Test AUC", roc_auc_score(y_test, proba))
print(classification_report(y_test, model.predict(X_test)))

joblib.dump(model, "model.joblib")`,
    }],
  },
  {
    id: 'sk-save-load', name: 'Save & load models', section: 'ML workflow', lib: [SK, PY],
    summary: 'Persist fitted models.',
    keywords: 'save load joblib pickle persist export onnx',
    snippets: [{
      title: 'Persist',
      code: `import joblib
joblib.dump(model, "model.joblib", compress=3)
model = joblib.load("model.joblib")

# Boosting libraries also have native formats
xgb_model.save_model("model.json")      # XGBoost
lgb_model.booster_.save_model("model.txt")  # LightGBM
cb_model.save_model("model.cbm")        # CatBoost`,
    }],
    tips: ['Load with the same library versions you saved with; record them in requirements.txt.'],
  },
  {
    id: 'optuna', name: 'Optuna tuning', section: 'ML workflow', lib: [PY, SK],
    import: 'import optuna  # pip install optuna',
    summary: 'Bayesian-style hyperparameter search with pruning — good for boosting libraries.',
    keywords: 'optuna hyperparameter tuning bayesian search trial',
    snippets: [{
      title: 'Tune LightGBM',
      code: `import optuna, lightgbm as lgb
from sklearn.model_selection import cross_val_score

def objective(trial):
    params = {
        "n_estimators": 1000,
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
        "num_leaves": trial.suggest_int("num_leaves", 15, 255, log=True),
        "min_child_samples": trial.suggest_int("min_child_samples", 5, 200, log=True),
        "subsample": trial.suggest_float("subsample", 0.5, 1.0), "subsample_freq": 1,
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.4, 1.0),
        "reg_lambda": trial.suggest_float("reg_lambda", 1e-3, 10, log=True),
        "verbose": -1,
    }
    return cross_val_score(lgb.LGBMClassifier(**params), X, y, cv=5, scoring="roc_auc").mean()

study = optuna.create_study(direction="maximize")
study.optimize(objective, n_trials=50, show_progress_bar=True)
study.best_params`,
    }],
  },

  // Python
  {
    id: 'py-utils', name: 'Python utilities', section: 'Python', lib: PY,
    summary: 'Files, JSON, timing, and progress bars.',
    keywords: 'pathlib json timing tqdm glob file',
    snippets: [{
      title: 'Utilities',
      code: `from pathlib import Path
import json, time
from tqdm.auto import tqdm

root = Path("data")
files = sorted(root.glob("**/*.csv"))
Path("out").mkdir(parents=True, exist_ok=True)

cfg = json.loads(Path("config.json").read_text())
Path("result.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))

t0 = time.perf_counter()
for f in tqdm(files):
    ...
print(f"{time.perf_counter() - t0:.2f}s")`,
    }],
  },
  {
    id: 'env-setup', name: 'Environment setup', section: 'Python', lib: PY,
    summary: 'Virtual environments, installs, and GPU checks.',
    keywords: 'venv pip install uv conda gpu cuda requirements',
    snippets: [
      { title: 'Create an environment', language: 'bash', code: 'python -m venv .venv && source .venv/bin/activate\npip install -U pip\npip install numpy pandas scikit-learn xgboost lightgbm catboost matplotlib seaborn\npip install torch torchvision  # see pytorch.org for the CUDA-specific command\npip freeze > requirements.txt' },
      { title: 'Check the GPU', code: 'import torch\ntorch.__version__, torch.cuda.is_available(), torch.cuda.device_count()\ntorch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu"' },
    ],
  },
]
