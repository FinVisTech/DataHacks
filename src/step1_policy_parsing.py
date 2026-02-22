"""
Step 1: Policy Parsing for the AI Civic Alignment System.

This module replaces the old data processor. It:
1. Loads Stanford AI Index labeled policies.
2. Fetches and loads OECD.AI policy initiatives.
3. Uses Hugging Face NLP API (zero-shot) to classify domains.
4. Generates policy features and saves the combined corpus.

Usage:
    python step1_policy_parsing.py          # Uses HF API by default
    python step1_policy_parsing.py --local  # Fallback to keyword classification
"""

import pandas as pd
import numpy as np
import time
import os
import sys
import argparse
from pathlib import Path
import warnings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Suppress pandas warnings for cleaner output
warnings.filterwarnings('ignore')

try:
    import oecd_data
except ImportError:
    print("❌ Error: oecd_data.py not found. Please ensure it is in the same directory.")
    sys.exit(1)

HF_INFERENCE_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
DOMAIN_CANDIDATE_LABELS = [
    "Privacy and data protection",
    "Employment and labor",
    "Economic policy",
    "Legal and governance",
    "Technology and AI",
    "Social welfare",
]
DOMAIN_LABEL_MAPPING = {
    "Privacy and data protection": "Privacy",
    "Employment and labor": "Employment",
    "Economic policy": "Economic",
    "Legal and governance": "Legal/Governance",
    "Technology and AI": "Technology",
    "Social welfare": "Social",
}

class CivicPolicyParser:
    def __init__(self, use_api=True, hf_token=None):
        self.use_api = use_api
        self.hf_token = hf_token or os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
        
        if self.use_api and not self.hf_token:
            print("  ⚠️ No Hugging Face token found. Falling back to keyword matching.")
            self.use_api = False
            
        self.stanford_policies = pd.DataFrame()
        self.us_regulations = pd.DataFrame()
        self.oecd_policies = pd.DataFrame()
        self.parsed_data = pd.DataFrame()

    def load_data(self):
        print("\n[1/3] Loading Data Sources...")
        
        # Load Stanford Data
        BASE = Path("data/PUBLIC DATA_ 2025 AI Index Report")
        try:
            self.stanford_policies = pd.read_csv(BASE / "8. Public Opinion/Data/fig_8.2.2.csv")
            self.stanford_policies.columns = [c.strip() for c in self.stanford_policies.columns]
            self.stanford_policies['pct'] = self.stanford_policies['% of respondents'].str.replace('%', '').astype(float)
            
            self.us_regulations = pd.read_csv(BASE / "6. Policy and Governance/Data/fig_6.2.20.csv")
            self.us_regulations.columns = [c.strip() for c in self.us_regulations.columns]
            print(f"  ✓ Loaded Stanford opinion data ({len(self.stanford_policies)} rows)")
        except Exception as e:
            print(f"  ❌ Error loading Stanford data: {e}")
            
        # Ensure data folder exists for oecd caching
        Path('data').mkdir(exist_ok=True)
        oecd_cache = Path('data/oecd_raw_data.csv')
        
        if oecd_cache.exists():
            print(f"  ✓ Loading OECD data from local cache: {oecd_cache}")
            self.oecd_policies = pd.read_csv(oecd_cache)
        else:
            print("  🌐 Fetching OECD policy corpus...")
            result = oecd_data.fetch_full_csv()
            self.oecd_policies = oecd_data.basic_clean(result.df)
            self.oecd_policies.to_csv(oecd_cache, index=False)
            print(f"  ✓ Fetched and cached OECD data to: {oecd_cache} ({len(self.oecd_policies)} rows)")
            
    def _classify_domain_nlp(self, text):
        if not self.use_api:
            return self._classify_domain_keyword(text)
            
        import requests
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        payload = {
            "inputs": text[:500], # Limit length for API
            "parameters": {"candidate_labels": DOMAIN_CANDIDATE_LABELS, "multi_label": False},
        }
        
        try:
            response = requests.post(HF_INFERENCE_URL, headers=headers, json=payload, timeout=10)
            data = response.json()
            
            if response.status_code == 503:
                time.sleep(5)
                response = requests.post(HF_INFERENCE_URL, headers=headers, json=payload, timeout=10)
                data = response.json()
                
            if "error" in data:
                return self._classify_domain_keyword(text)
                
            predicted_label = data.get("labels", [])[0]
            time.sleep(0.2) # Rate limit protection
            return DOMAIN_LABEL_MAPPING.get(predicted_label, "Other")
        except:
            return self._classify_domain_keyword(text)

    def _classify_domain_keyword(self, text):
        text = str(text).lower()
        if any(x in text for x in ['privacy', 'data']): return 'Privacy'
        elif any(x in text for x in ['employment', 'work', 'job', 'skill', 'wage']): return 'Employment'
        elif any(x in text for x in ['tax', 'economy', 'budget', 'fund', 'investment']): return 'Economic'
        elif any(x in text for x in ['law', 'govern', 'regul', 'ban', 'directive']): return 'Legal/Governance'
        elif any(x in text for x in ['tech', 'research', 'compute', 'hardware', 'model']): return 'Technology'
        elif any(x in text for x in ['society', 'health', 'public', 'citizen']): return 'Social'
        return 'Other'

    def extract_features(self, text_lower):
        return {
            'is_privacy': 1 if 'privacy' in text_lower or 'data' in text_lower else 0,
            'is_employment': 1 if any(x in text_lower for x in ['hiring', 'job', 'work']) else 0,
            'is_economic': 1 if any(x in text_lower for x in ['tax', 'fund', 'invest']) else 0,
            'is_legal': 1 if any(x in text_lower for x in ['regul', 'law', 'act', 'ban']) else 0,
            'is_tech': 1 if any(x in text_lower for x in ['ai', 'tech', 'compute']) else 0,
            'is_social': 1 if any(x in text_lower for x in ['health', 'public', 'society']) else 0,
        }

    def extract_stakeholders(self, text_lower):
        stakeholders = []
        if any(x in text_lower for x in ['student', 'school', 'education', 'university']): stakeholders.append('Education')
        if any(x in text_lower for x in ['worker', 'employee', 'labor', 'union']): stakeholders.append('Labor')
        if any(x in text_lower for x in ['business', 'startup', 'company', 'industry', 'corporate']): stakeholders.append('Business')
        if any(x in text_lower for x in ['citizen', 'public', 'consumer', 'voter']): stakeholders.append('General Public')
        if any(x in text_lower for x in ['agency', 'government', 'police', 'military']): stakeholders.append('Government')
        return ", ".join(stakeholders) if stakeholders else "General Public"

    def process_stanford(self):
        policies = self.stanford_policies['Policy'].unique()
        results = []
        for i, policy in enumerate(policies):
            p_data = self.stanford_policies[self.stanford_policies['Policy'] == policy]
            agree = p_data[p_data['Label'] == 'Agree']['pct'].values[0]
            neutral = p_data[p_data['Label'] == 'Neither agree nor disagree']['pct'].values[0]
            disagree = p_data[p_data['Label'] == 'Disagree']['pct'].values[0]
            
            domain = self._classify_domain_nlp(policy)
            feats = self.extract_features(policy.lower())
            stakeholders = self.extract_stakeholders(policy.lower())
            
            results.append({
                'source': 'Stanford',
                'policy_text': policy,
                'domain': domain,
                'stakeholders': stakeholders,
                'agree_pct': agree,
                'neutral_pct': neutral,
                'disagree_pct': disagree,
                'support_score': agree - disagree,
                'consensus_score': agree + neutral,
                'word_count': len(str(policy).split()),
                'year': 2024, # Approximate recent polling year
                **feats
            })
            if (i+1) % 5 == 0:
                print(f"    Stanford NLP processed: {i+1}/{len(policies)}")
        return pd.DataFrame(results)

    def process_oecd(self):
        # Processing all 1000+ policies
        sampled_oecd = self.oecd_policies.copy().reset_index(drop=True)
        results = []
        for i, row in sampled_oecd.iterrows():
            # OECD CSV Headers: English name, Description, Country, Start date
            title = str(row.get('English name', ''))
            desc = str(row.get('Description', ''))
            text = f"{title}. {desc}"
            
            # Extract year from Start date (format: 2021-01-01 or sometimes just 2021)
            start_date = row.get('Start date', '')
            year = np.nan
            if pd.notna(start_date) and start_date != '':
                if isinstance(start_date, (pd.Timestamp, pd.DatetimeIndex)):
                    year = start_date.year
                else:
                    try:
                        # Try to get the first 4 characters if it looks like a year
                        s = str(start_date).strip()
                        if len(s) >= 4 and s[:4].isdigit():
                            year = int(s[:4])
                    except:
                        pass

            # Using metadata where possible, fallback to NLP
            domain = self._classify_domain_nlp(title)
            feats = self.extract_features(text.lower())
            stakeholders = self.extract_stakeholders(text.lower())
            
            results.append({
                'source': 'OECD',
                'policy_text': title,
                'description': desc[:500],
                'domain': domain,
                'policy_type': row.get('Type of measure', 'Unknown'),
                'stakeholders': stakeholders,
                'country': row.get('Country', 'Unknown'),
                'year': year,
                'word_count': len(title.split()),
                **feats
            })
            if (i+1) % 50 == 0:
                print(f"    OECD NLP processed: {i+1}/{len(sampled_oecd)}")
        return pd.DataFrame(results)

    def run(self):
        self.load_data()
        
        print("\n[2/3] Processing and Classifying Policies (This may take a minute with API)...")
        print("  Processing Stanford public opinion policies...")
        stanford_df = self.process_stanford()
        
        print("  Processing sample of OECD policies...")
        oecd_df = self.process_oecd()
        
        # Merge
        print("\n[3/3] Finalizing Data Structure...")
        self.parsed_data = pd.concat([stanford_df, oecd_df], ignore_index=True)
        
        # Fill NaNs for sentiment columns in OECD data
        sentiment_cols = ['agree_pct', 'neutral_pct', 'disagree_pct', 'support_score', 'consensus_score']
        for col in sentiment_cols:
            if col in self.parsed_data.columns:
                self.parsed_data[col] = self.parsed_data[col].fillna(0)
                
        out_path = 'data/step1_parsed_policies.csv'
        self.parsed_data.to_csv(out_path, index=False)
        print(f"  ✓ Saved combined policy corpus to: {out_path}")
        print(f"  ✓ Total Policies: {len(self.parsed_data)} ({len(stanford_df)} Stanford, {len(oecd_df)} OECD)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Step 1: Parse and classify Stanford & OECD policies.")
    parser.add_argument("--local", action="store_true", help="Fallback to fast local keyword matching.")
    args = parser.parse_args()
    
    print("="*60)
    print("📋 Step 1: Policy Parsing Engine")
    print("="*60)
    
    # We default to API, meaning use_api=not args.local
    app = CivicPolicyParser(use_api=not args.local)
    app.run()
    
    print("\n✅ Step 1 complete. Next: Proceed to Step 2 to estimate policymaker support.")
    print("="*60)
