"""
Step 5: Policy Translator (Civic Interface)

This module acts as the front-end for citizens to understand new AI policies.
It accepts a policy text, classifies its domain/features, estimates 
policymaker support, finds similar historical OECD precedents, 
and provides the alignment context for that domain.

Usage:
    python step5_policy_translator.py "Mandatory security audits for large AI models"
"""

import sys
import pickle
import argparse
import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import warnings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import parser for feature extraction
try:
    from step1_policy_parsing import CivicPolicyParser
except ImportError:
    print("❌ Error: step1_policy_parsing.py not found.")
    sys.exit(1)

warnings.filterwarnings('ignore')

class PolicyTranslator:
    def __init__(self):
        # 1. Load Step 1 Data (for similarity search)
        p1 = Path('data/step1_parsed_policies.csv')
        if not p1.exists():
            print("❌ Error: Missing outputs/step1_parsed_policies.csv")
            sys.exit(1)
            
        self.corpus = pd.read_csv(p1)
        self.oecd_corpus = self.corpus[self.corpus['source'] == 'OECD'].copy()
        # Handle cases where columns might be empty string or NaN from CSV
        self.oecd_corpus['content'] = self.oecd_corpus['policy_text'].fillna('').astype(str) + " " + \
                                     self.oecd_corpus['description'].fillna('').astype(str)
        self.oecd_corpus['content'] = self.oecd_corpus['content'].fillna('')
        
        # Fit TF-IDF for similarity search
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = self.vectorizer.fit_transform(self.oecd_corpus['content'])
        
        # 2. Load Step 2 Model (Support Estimator)
        p2 = Path('models/step2_support_estimator.pkl')
        if not p2.exists():
            print("❌ Error: Missing models/step2_support_estimator.pkl")
            sys.exit(1)
        with open(p2, 'rb') as f:
            self.estimator = pickle.load(f)
            
        # 3. Load Step 3 Alignment Matrix (Context)
        p3 = Path('data/step3_domain_alignment.csv')
        if not p3.exists():
            print("❌ Error: Missing outputs/step3_domain_alignment.csv")
            sys.exit(1)
        self.alignment_df = pd.read_csv(p3)
        
        # Initialize Parser for NLP
        self.parser = CivicPolicyParser(use_api=True) # Default to API for accuracy

    def analyze(self, policy_text):
        """Runs the translation pipeline on a new text."""
        # 1. Parse & Extract Features
        # Note: In a real app we'd use use_api=True for _classify_domain_nlp, 
        # but for fast translation we'll use Keyword fallback here if token is missing.
        domain = self.parser._classify_domain_nlp(policy_text)
        feats = self.parser.extract_features(policy_text.lower())
        stakeholders = self.parser.extract_stakeholders(policy_text.lower())
        
        # Generate DataFrame for Estimation
        df_new = pd.DataFrame([{
            'policy_text': policy_text,
            'domain': domain,
            'stakeholders': stakeholders,
            'word_count': len(policy_text.split()),
            **feats
        }])
        
        # Mock Context indices (in reality from Step 3 averages or real API)
        domain_context = self.alignment_df[self.alignment_df['domain'] == domain]
        if not domain_context.empty:
            df_new['policy_density_context'] = domain_context['regulation_intensity_index'].values[0] / 100.0
            df_new['economic_pressure_context'] = domain_context['economic_pressure_index'].values[0] / 100.0
            df_new['education_readiness_context'] = domain_context['readiness_index'].values[0] / 100.0
        else:
            df_new['policy_density_context'] = 0.5
            df_new['economic_pressure_context'] = 0.5
            df_new['education_readiness_context'] = 0.5
            
        # 2. Estimate Support
        df_new['domain_encoded'] = df_new['domain'].apply(
            lambda x: self.estimator['le_domain'].transform([x])[0] if x in self.estimator['le_domain'].classes_ else -1
        )
        df_new['stakeholder_encoded'] = df_new['stakeholders'].apply(
            lambda x: self.estimator['le_stakeholder'].transform([x])[0] if x in self.estimator['le_stakeholder'].classes_ else -1
        )
        
        X = df_new[self.estimator['feature_cols']]
        X_scaled = self.estimator['scaler'].transform(X)
        support_pred = self.estimator['model'].predict(X_scaled)[0]
        support_prob = max(self.estimator['model'].predict_proba(X_scaled)[0])
        
        # 3. Find Similar OECD Precedents
        new_vec = self.vectorizer.transform([policy_text])
        sims = cosine_similarity(new_vec, self.tfidf_matrix)[0]
        # Get top 10 candidates to account for potential duplicates
        top_candidates = sims.argsort()[-10:][::-1] 
        
        similar_policies = []
        seen_titles = set()
        for idx in top_candidates:
            if len(similar_policies) >= 2:
                break
            if sims[idx] > 0.05: # threshold
                row = self.oecd_corpus.iloc[idx]
                title = str(row['policy_text']).strip()
                if title == 'nan' or not title:
                    title = "Unnamed AI Policy Initiative"
                
                if title not in seen_titles:
                    similar_policies.append({
                        'title': title,
                        'country': str(row['country']),
                        'similarity': sims[idx]
                    })
                    seen_titles.add(title)
        
        # Format Translation Output
        self._print_translation(policy_text, domain, stakeholders, support_pred, support_prob, similar_policies, domain_context)


    def analyze_json(self, policy_text):
        """Runs the translation pipeline and returns a JSON-serializable dictionary."""
        # 1. Parse & Extract Features
        domain = self.parser._classify_domain_nlp(policy_text)
        feats = self.parser.extract_features(policy_text.lower())
        stakeholders = self.parser.extract_stakeholders(policy_text.lower())
        
        df_new = pd.DataFrame([{
            'policy_text': policy_text,
            'domain': domain,
            'stakeholders': stakeholders,
            'word_count': len(policy_text.split()),
            **feats
        }])
        
        domain_context = self.alignment_df[self.alignment_df['domain'] == domain]
        if not domain_context.empty:
            df_new['policy_density_context'] = domain_context['regulation_intensity_index'].values[0] / 100.0
            df_new['economic_pressure_context'] = domain_context['economic_pressure_index'].values[0] / 100.0
            df_new['education_readiness_context'] = domain_context['readiness_index'].values[0] / 100.0
        else:
            df_new['policy_density_context'] = 0.5
            df_new['economic_pressure_context'] = 0.5
            df_new['education_readiness_context'] = 0.5
            
        # 2. Estimate Support
        df_new['domain_encoded'] = df_new['domain'].apply(
            lambda x: self.estimator['le_domain'].transform([x])[0] if x in self.estimator['le_domain'].classes_ else -1
        )
        df_new['stakeholder_encoded'] = df_new['stakeholders'].apply(
            lambda x: self.estimator['le_stakeholder'].transform([x])[0] if x in self.estimator['le_stakeholder'].classes_ else -1
        )
        
        X = df_new[self.estimator['feature_cols']]
        X_scaled = self.estimator['scaler'].transform(X)
        support_pred = self.estimator['model'].predict(X_scaled)[0]
        support_probs = self.estimator['model'].predict_proba(X_scaled)[0]
        support_prob = max(support_probs)
        
        # 3. Find Similar OECD Precedents
        new_vec = self.vectorizer.transform([policy_text])
        sims = cosine_similarity(new_vec, self.tfidf_matrix)[0]
        top_candidates = sims.argsort()[-10:][::-1] 
        
        similar_policies = []
        seen_titles = set()
        for idx in top_candidates:
            if len(similar_policies) >= 2:
                break
            if sims[idx] > 0.05:
                row = self.oecd_corpus.iloc[idx]
                title = str(row['policy_text']).strip()
                if title == 'nan' or not title:
                    title = "Unnamed AI Policy Initiative"
                
                if title not in seen_titles:
                    similar_policies.append({
                        'title': title,
                        'country': str(row['country']),
                        'similarity': float(sims[idx])
                    })
                    seen_titles.add(title)

        # Context packaging
        context_data = None
        if not domain_context.empty:
            c = domain_context.iloc[0]
            context_data = {
                'archetype': str(c['archetype']),
                'citizen_policymaker_gap': float(c['citizen_policymaker_gap']),
                'policy_lag_score': float(c['policy_lag_score']),
                'regulation_intensity_index': float(c['regulation_intensity_index']),
                'economic_pressure_index': float(c['economic_pressure_index']),
                'readiness_index': float(c['readiness_index']),
                'domain_alignment_score': float(c.get('domain_alignment_score', 50.0)),
                'momentum_index': float(c.get('momentum_index', 50.0)),
                'citizen_sentiment_index': float(c.get('citizen_sentiment_index', 50.0)),
                'policymaker_support_index': float(c.get('policymaker_support_index', 50.0))
            }

        return {
            'text': policy_text,
            'classification': {
                'domain': domain,
                'stakeholders': stakeholders
            },
            'estimation': {
                'support_level': str(support_pred),
                'confidence': float(support_prob),
                'probabilities': [float(p) for p in support_probs]
            },
            'context': context_data,
            'similar_policies': similar_policies
        }


    def _print_translation(self, text, domain, stakeholders, support, prob, similar, context):
        print("\n" + "=" * 80)
        print("🏛️  CIVIC POLICY TRANSLATOR")
        print("=" * 80)
        print(f"\n📝 POLICY TEXT:\n   \"{text}\"")
        print(f"\n🏷️  CLASSIFICATION:\n   Domain:       {domain.upper()}")
        print(f"   Stakeholders: {stakeholders}")
        
        print(f"\n🔮 POLICYMAKER RECEPTION ESTIMATE:")
        print(f"   Expected Support Level: {support.upper()} ({prob:.1%} confidence)")
        
        if not context.empty:
            print(f"\n⚖️  DOMAIN ALIGNMENT CONTEXT ({domain.upper()}):")
            c = context.iloc[0]
            print(f"   Overall Alignment Profile:  {c['archetype']}")
            print(f"   Civic-Policymaker Disconnect: {c['citizen_policymaker_gap']:.1f}/100 points")
            if c['policy_lag_score'] > 20:
                print("   Current Market Status:      Regulation is lagging behind economic needs.")
        
        print("\n🌍 GLOBAL PRECEDENTS (OECD.AI):")
        if similar:
            for s in similar:
                print(f"   • [{s['country']}] {s['title']} (Similarity: {s['similarity']:.1%})")
        else:
            print("   (No highly similar precedents found in recent global tracking.)")
            
        print("\n" + "=" * 80)

def main():
    parser = argparse.ArgumentParser(description="Civic interface for translating and contextualizing new policies.")
    parser.add_argument("policy", nargs="?", default="Mandatory transparency reports for algorithmic hiring tools to prevent racial discrimination.", help="Text of the policy to analyze")
    args = parser.parse_args()
    
    app = PolicyTranslator()
    app.analyze(args.policy)

if __name__ == "__main__":
    main()
