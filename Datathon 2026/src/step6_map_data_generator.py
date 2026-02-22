import pandas as pd
import os

DATA_ROOT = "../data"

oecd = pd.read_csv(os.path.join(DATA_ROOT, "step1_oecd_parsed.csv"))

country_counts = oecd.groupby("country").size().rename("policy_count")

country_counts.to_csv(os.path.join(DATA_ROOT, "global_map_data.csv"))

print("Step6 complete")