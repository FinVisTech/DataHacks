"""
Step 2: Policymaker Support Estimation

This module reads the parsed policies and trains a Random Forest Estimator 
based on the 15 labeled Stanford local official policies. It serves as a 
decision-support tool to estimate policymaker support for new, unlabeled 
policies (like the OECD corpus or user-uploaded texts).

Outputs:
    - Estimated Support Bucket (High/Medium/Low)
    - Probability/Confidence
    - Feature Importance
"""

import pandas as pd
import numpy as np
import pickle
import sys
import warnings
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler

warnings.filterwarnings('ignore')

class ContextualFeatureEngine:
    """
    Simulates or retrieves the required Stanford Context signals 
    (Education readiness, Economic pressure, Policy density) 
    that drive the alignment engine and support estimation.
    In a full production environment, these would map to live AI Index 
    data streams per state/country. Here we use structural proxies.
    """
    def __init__(self, full_df):
        self.full_df = full_df
        # Compute real policy density from the dataset per domain
        self.domain_counts = full_df['domain'].value_counts().to_dict()
        self.total_policies = len(full_df)

    def append_context_features(self, df):
        df = df.copy()
        
        # 1. Policy density context (Real data from step 1)
        df['policy_density_context'] = df['domain'].map(
            lambda d: self.domain_counts.get(d, 0) / self.total_policies
        )
        
        # 2. Economic Pressure Context (Proxy mapping)
        # Based on Domain: Economic and Employment have higher economic pressure
        eco_map = {'Economic': 0.85, 'Employment': 0.90, 'Technology': 0.70, 
                   'Privacy': 0.60, 'Legal/Governance': 0.50, 'Social': 0.65}
        df['economic_pressure_context'] = df['domain'].map(lambda d: eco_map.get(d, 0.5))
        
        # 3. Education Readiness Context (Proxy mapping)
        edu_map = {'Technology': 0.80, 'Employment': 0.60, 'Economic': 0.75,
                   'Social': 0.40, 'Privacy': 0.50, 'Legal/Governance': 0.55}
        df['education_readiness_context'] = df['domain'].map(lambda d: edu_map.get(d, 0.5))
        
        return df


class SupportEstimator:
    def __init__(self):
        self.model = None
        self.le_domain = LabelEncoder()
        self.le_stakeholder = LabelEncoder()
        self.scaler = StandardScaler()
        self.feature_cols = []
        
    def prepare_data(self, df):
        # Create Target Bins for the Stanford Labelled Data
        # support_score is Agree - Disagree
        # High > 20%, Medium 0-20%, Low < 0%
        df['support_bucket'] = pd.cut(
            df['support_score'],
            bins=[-100, 0, 20, 100],
            labels=['Low', 'Medium', 'High']
        )
        
        # Encode categoricals
        df['domain_encoded'] = self.le_domain.fit_transform(df['domain'].astype(str))
        df['stakeholder_encoded'] = self.le_stakeholder.fit_transform(df['stakeholders'].astype(str))
        
        self.feature_cols = [
            'word_count', 'is_privacy', 'is_employment', 'is_economic',
            'is_legal', 'is_tech', 'is_social',
            'domain_encoded', 'stakeholder_encoded',
            'policy_density_context', 'economic_pressure_context', 'education_readiness_context'
        ]
        
        return df
        
    def train(self, df_train):
        X = df_train[self.feature_cols]
        y = df_train['support_bucket'].astype(str)
        
        # Standardize
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest
        self.model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42, class_weight='balanced')
        self.model.fit(X_scaled, y)
        
        return self.model
        
    def get_feature_importance(self):
        if not self.model: return None
        return pd.DataFrame({
            'Feature': self.feature_cols,
            'Importance': self.model.feature_importances_
        }).sort_values(by='Importance', ascending=False)
        
    def predict_support(self, df_new):
        """Estimate support for unlabeled policies (e.g. OECD corpus)."""
        df_new = df_new.copy()
        
        # Handle unseen domains/stakeholders gracefully
        df_new['domain_encoded'] = df_new['domain'].apply(
            lambda x: self.le_domain.transform([x])[0] if x in self.le_domain.classes_ else -1
        )
        df_new['stakeholder_encoded'] = df_new['stakeholders'].apply(
            lambda x: self.le_stakeholder.transform([x])[0] if x in self.le_stakeholder.classes_ else -1
        )
        
        X = df_new[self.feature_cols]
        X_scaled = self.scaler.transform(X)
        
        df_new['estimated_support_bucket'] = self.model.predict(X_scaled)
        df_new['support_probability'] = np.max(self.model.predict_proba(X_scaled), axis=1)
        
        return df_new

    def save(self, path='models/step2_support_estimator.pkl'):
        Path('models').mkdir(exist_ok=True)
        data = {
            'model': self.model,
            'le_domain': self.le_domain,
            'le_stakeholder': self.le_stakeholder,
            'scaler': self.scaler,
            'feature_cols': self.feature_cols
        }
        with open(path, 'wb') as f:
            pickle.dump(data, f)


def main():
    print("="*60)
    print("🏛️  Step 2: Policymaker Support Estimation")
    print("="*60)
    
    input_path = Path('data/step1_parsed_policies.csv')
    if not input_path.exists():
        print(f"❌ Error: {input_path} not found. Run step 1 first.")
        sys.exit(1)
        
    print("[1/3] Loading parsed policy data & appending context...")
    df = pd.read_csv(input_path)
    
    # 1. Append Contextual Features
    context_engine = ContextualFeatureEngine(df)
    df = context_engine.append_context_features(df)
    
    # 2. Split into Train (Stanford) and Infer (OECD)
    stanford_df = df[df['source'] == 'Stanford'].copy()
    oecd_df = df[df['source'] == 'OECD'].copy()
    
    print(f"  ✓ Training set: {len(stanford_df)} labeled Stanford policies")
    print(f"  ✓ Inference set: {len(oecd_df)} unlabeled OECD policies")
    
    print("\n[2/3] Training Support Estimator (Random Forest)...")
    estimator = SupportEstimator()
    stanford_df = estimator.prepare_data(stanford_df)
    estimator.train(stanford_df)
    
    print("\n[Feature Importance for Policymaker Support]")
    fi = estimator.get_feature_importance()
    for _, row in fi.head(5).iterrows():
        bar = "█" * int(row['Importance'] * 30)
        print(f"  {row['Feature']:28s} {bar} {row['Importance']:.3f}")
        
    print("\n[3/3] Estimating Support for OECD Policy Corpus...")
    oecd_df = estimator.predict_support(oecd_df)
    
    # Combine back to save full dataset with estimates
    # For Stanford, actual bucket is known, estimated is predicted
    stanford_df['estimated_support_bucket'] = estimator.model.predict(estimator.scaler.transform(stanford_df[estimator.feature_cols]))
    stanford_df['support_probability'] = np.max(estimator.model.predict_proba(estimator.scaler.transform(stanford_df[estimator.feature_cols])), axis=1)
    
    final_df = pd.concat([stanford_df, oecd_df], ignore_index=True)
    
    out_path = 'data/step2_estimated_policies.csv'
    final_df.to_csv(out_path, index=False)
    estimator.save()
    
    print(f"\n  ✓ Estimates saved to: {out_path}")
    print(f"  ✓ Estimator model saved to: models/step2_support_estimator.pkl")
    print("\n✅ Step 2 complete. Next: Proceed to Step 3 (Alignment Engine).")
    print("="*60)

if __name__ == "__main__":
    main()
