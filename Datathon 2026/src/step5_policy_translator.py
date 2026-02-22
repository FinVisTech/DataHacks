import pandas as pd
import os
import sys
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_ROOT = "../data"

oecd = pd.read_csv(os.path.join(DATA_ROOT, "step1_oecd_parsed.csv"))

vec = TfidfVectorizer(stop_words="english")
X = vec.fit_transform(oecd["title"].fillna(""))

def analyze(text):
    q = vec.transform([text])
    sims = cosine_similarity(q, X)[0]
    idx = sims.argsort()[-3:][::-1]

    print("\nSimilar policies:")
    for i in idx:
        print(oecd.iloc[i]["title"], sims[i])

if __name__ == "__main__":
    analyze(sys.argv[1] if len(sys.argv) > 1 else "Ban facial recognition")