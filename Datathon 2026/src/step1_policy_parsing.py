import pandas as pd
import os

DATA_ROOT = "../data"

STANFORD_SUPPORT = os.path.join(
    DATA_ROOT,
    "PUBLIC DATA_ 2025 AI Index Report",
    "8. Public Opinion",
    "Data",
    "fig_8.2.2.csv"
)

OECD_PATH = os.path.join(DATA_ROOT, "oecd_raw_data.csv")


def classify_domain(text: str):
    text = str(text).lower()
    if "privacy" in text or "data" in text:
        return "privacy"
    if "job" in text or "work" in text:
        return "employment"
    if "econom" in text:
        return "economic"
    if "law" in text or "ban" in text or "regulat" in text:
        return "legal"
    if "ai" in text or "model" in text:
        return "technology"
    return "social"


def parse_stanford_support(df):
    pivot = df.pivot_table(index="Policy", columns="Label", values="% of respondents")
    pivot = pivot.fillna(0)

    pivot["support_score"] = pivot.get("Agree", 0) - pivot.get("Disagree", 0)
    pivot["consensus_score"] = pivot.get("Agree", 0) + pivot.get("Neither agree nor disagree", 0)

    pivot = pivot.reset_index()
    pivot["domain"] = pivot["Policy"].apply(classify_domain)
    return pivot


def parse_oecd(df):
    rows = []
    for _, r in df.iterrows():
        text = f"{r.get('English name','')} {r.get('Description','')}"
        rows.append({
            "title": r.get("English name"),
            "description": r.get("Description"),
            "domain": classify_domain(text),
            "word_count": len(str(text).split()),
            "country": r.get("Country"),
            "year": str(r.get("Start date", ""))[:4]
        })
    return pd.DataFrame(rows)


if __name__ == "__main__":
    stanford = pd.read_csv(STANFORD_SUPPORT)
    oecd = pd.read_csv(OECD_PATH)

    stanford_parsed = parse_stanford_support(stanford)
    oecd_parsed = parse_oecd(oecd)

    stanford_parsed.to_csv(os.path.join(DATA_ROOT, "step1_stanford_parsed.csv"), index=False)
    oecd_parsed.to_csv(os.path.join(DATA_ROOT, "step1_oecd_parsed.csv"), index=False)

    print("Step1 complete")