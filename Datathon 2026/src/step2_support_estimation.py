import pandas as pd
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import accuracy_score

DATA_ROOT = "../data"

df = pd.read_csv(os.path.join(DATA_ROOT, "step1_stanford_parsed.csv"))

def bucket(x):
    if x < 40: return 0
    if x < 60: return 1
    return 2

df["y"] = df["support_score"].apply(bucket)

X = pd.get_dummies(df[["domain", "consensus_score"]])
y = df["y"]

rf = RandomForestClassifier(n_estimators=100)
lr = LogisticRegression(max_iter=1000)

loo = LeaveOneOut()

rf_scores = []
lr_scores = []

for train, test in loo.split(X):
    rf.fit(X.iloc[train], y.iloc[train])
    lr.fit(X.iloc[train], y.iloc[train])

    rf_scores.append(accuracy_score(y.iloc[test], rf.predict(X.iloc[test])))
    lr_scores.append(accuracy_score(y.iloc[test], lr.predict(X.iloc[test])))

print("RF LOOCV:", sum(rf_scores)/len(rf_scores))
print("LR LOOCV:", sum(lr_scores)/len(lr_scores))

rf.fit(X, y)

oecd = pd.read_csv(os.path.join(DATA_ROOT, "step1_oecd_parsed.csv"))
X_oecd = pd.get_dummies(oecd[["domain", "word_count"]]).reindex(columns=X.columns, fill_value=0)

oecd["support_pred"] = rf.predict(X_oecd)
oecd.to_csv(os.path.join(DATA_ROOT, "step2_predictions.csv"), index=False)

print("Step2 complete")