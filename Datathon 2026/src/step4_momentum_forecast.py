import pandas as pd
import os

DATA_ROOT = "../data"

df = pd.read_csv(os.path.join(DATA_ROOT, "step3_alignment.csv"))

df["momentum_indicator"] = df["policy_activity"].rank(pct=True) * 100

df.to_csv(os.path.join(DATA_ROOT, "step4_momentum.csv"))

print("Step4 complete")