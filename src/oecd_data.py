#!/usr/bin/env python3
"""
Fetch OECD.AI policy initiatives data for your project.

Two retrieval options:
  A) Full CSV dump of all AI policies (simple, best for hackathons)
  B) STIP API query (filterable; returns CSV)

Sources:
- OECD.AI Policy Navigator lists "policy initiatives" and filters like Category/Status/Start year
  https://oecd.ai/en/dashboards/policy-initiatives
- Full CSV dump hosted on wp.oecd.ai:
  https://wp.oecd.ai/app/uploads/2024/03/oecd-ai-all-ai-policies.csv
- STIP API example (CSV output):
  https://stip.oecd.org/ws/STIP/API/getPolicyInitiatives.xqy?...&format=csv

Usage examples:
  python oecd_ai_policies_fetch.py --mode full --out oecd_policies.csv
  python oecd_ai_policies_fetch.py --mode stip --out stip_policies.csv --tg TG23 --th TH8 --br "BR9,BR15" --br-extra "none,BR16,BR1"
"""

from __future__ import annotations

import argparse
import io
import os
import sys
import time
from dataclasses import dataclass
from typing import Dict, Optional
from urllib.parse import urlencode

import pandas as pd
import requests


DEFAULT_FULL_CSV_URL = "https://wp.oecd.ai/app/uploads/2024/03/oecd-ai-all-ai-policies.csv"
DEFAULT_STIP_API_URL = "https://stip.oecd.org/ws/STIP/API/getPolicyInitiatives.xqy"


@dataclass
class FetchResult:
    df: pd.DataFrame
    source_url: str


def _http_get(url: str, timeout: int = 60) -> requests.Response:
    headers = {
        "User-Agent": "oecd-ai-policy-fetch/1.0 (educational use; datathon project)"
    }
    r = requests.get(url, headers=headers, timeout=timeout)
    r.raise_for_status()
    return r


def fetch_full_csv(url: str = DEFAULT_FULL_CSV_URL) -> FetchResult:
    """
    Download the full OECD.AI 'all AI policies' CSV.
    """
    r = _http_get(url)
    # Read as text CSV; pandas can infer delimiter/encoding for standard CSV.
    df = pd.read_csv(io.BytesIO(r.content))
    return FetchResult(df=df, source_url=url)


def fetch_stip_csv(
    base_url: str = DEFAULT_STIP_API_URL,
    tg: Optional[str] = None,
    th: Optional[str] = None,
    br: Optional[str] = None,
    br_extra: Optional[str] = None,
    extra_params: Optional[Dict[str, str]] = None,
) -> FetchResult:
    """
    Query the OECD STIP API endpoint used by OECD policy initiatives tooling.

    Parameters are passed through as query params.
    Example params seen in the wild include:
      - tg (tag group), th (theme), br and br-extra (broad filters)
      - format=csv

    Note: OECD can change param semantics; treat this as best-effort.
    """
    params: Dict[str, str] = {"format": "csv"}
    if tg:
        params["tg"] = tg
    if th:
        params["th"] = th
    if br:
        params["br"] = br
    if br_extra:
        params["br-extra"] = br_extra
    if extra_params:
        params.update(extra_params)

    url = f"{base_url}?{urlencode(params)}"
    r = _http_get(url)
    # STIP API returns CSV text
    text = r.content.decode("utf-8", errors="replace")
    df = pd.read_csv(io.StringIO(text))
    return FetchResult(df=df, source_url=url)


def basic_clean(df: pd.DataFrame) -> pd.DataFrame:
    """
    Minimal cleaning for downstream analysis:
      - strip whitespace from column names
      - drop duplicate rows
      - standardize obvious date columns (best-effort)
    """
    out = df.copy()
    out.columns = [c.strip() for c in out.columns]

    # Drop exact duplicates
    out = out.drop_duplicates()

    # Best-effort date parsing for common columns
    for col in out.columns:
        if "date" in col.lower() or "year" in col.lower():
            # Check if it's already an integer or looks like a year-only column
            # If values are just 4-digit integers, don't use to_datetime
            col_series = out[col].dropna()
            if not col_series.empty:
                try:
                    # If all values are 4-digit integers/strings, skip datetime conversion
                    as_ints = pd.to_numeric(col_series, errors='coerce')
                    if as_ints.notna().all() and (as_ints > 1900).all() and (as_ints < 2100).all():
                        continue
                except:
                    pass

            # Try parsing; keep original if parsing fails badly.
            try:
                parsed = pd.to_datetime(out[col], errors="coerce")
                # If at least 20% parses, keep parsed
                if parsed.notna().mean() >= 0.2:
                    out[col] = parsed
            except Exception:
                pass

    return out


def save_outputs(df: pd.DataFrame, out_path: str) -> None:
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    df.to_csv(out_path, index=False)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["full", "stip"], required=True,
                    help="full: download the full OECD.AI CSV dump; stip: query the STIP API")
    ap.add_argument("--out", required=True, help="Output CSV file path")
    ap.add_argument("--no-clean", action="store_true", help="Skip basic cleaning")

    # Full CSV options
    ap.add_argument("--full-url", default=DEFAULT_FULL_CSV_URL, help="Full CSV URL")

    # STIP options
    ap.add_argument("--stip-url", default=DEFAULT_STIP_API_URL, help="STIP API base URL")
    ap.add_argument("--tg", default=None, help="STIP query param tg (optional)")
    ap.add_argument("--th", default=None, help="STIP query param th (optional)")
    ap.add_argument("--br", default=None, help="STIP query param br (optional). Example: 'BR9,BR15'")
    ap.add_argument("--br-extra", default=None, help="STIP query param br-extra (optional). Example: 'none,BR16,BR1'")

    args = ap.parse_args()

    t0 = time.time()
    if args.mode == "full":
        result = fetch_full_csv(args.full_url)
    else:
        result = fetch_stip_csv(
            base_url=args.stip_url,
            tg=args.tg,
            th=args.th,
            br=args.br,
            br_extra=args.br_extra,
        )

    df = result.df
    if not args.no_clean:
        df = basic_clean(df)

    save_outputs(df, args.out)

    print(f"Saved: {args.out}")
    print(f"Rows: {len(df):,} | Cols: {df.shape[1]}")
    print(f"Source URL: {result.source_url}")
    print(f"Elapsed: {time.time() - t0:.2f}s")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)