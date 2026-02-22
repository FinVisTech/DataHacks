import pandas as pd
import os

DATA_ROOT = "../data"

stanford = pd.read_csv(os.path.join(DATA_ROOT, "step1_stanford_parsed.csv"))
oecd = pd.read_csv(os.path.join(DATA_ROOT, "step2_predictions.csv"))

official = stanford.groupby("domain")["support_score"].mean().rename("official_sentiment")
activity = oecd.groupby("domain").size().rename("policy_activity")

df = pd.concat([official, activity], axis=1).fillna(0)

df["official_action_gap"] = df["official_sentiment"] - df["policy_activity"]

df.to_csv(os.path.join(DATA_ROOT, "step3_alignment.csv"))

print("Step3 complete")