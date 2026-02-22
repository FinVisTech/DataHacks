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
    - Validation Metrics (LOOCV)
"""

import pandas as pd
import numpy as np
import pickle
import sys
import warnings
from pathlib import Path
from sklearn.model_selection import LeaveOneOut
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix

warnings.filterwarnings('ignore')

class ContextualFeatureEngine:
    """
    Retrieves real Stanford AI Index data (Education readiness, 
    Economic pressure, Policy density) to drive the alignment engine 
    and support estimation, replacing previous structural proxies.
    """
    def __init__(self, full_df):
        self.full_df = full_df
        # Load external data sources as identified in data_provenance.yaml
        self.base_path = Path("data/PUBLIC DATA_ 2025 AI Index Report")
        
    def _load_and_scale_proxy(self, file_path, group_col, value_col, rename_col):
        """Helper to load a CSV, group by country, average, and MinMax scale to 0-100."""
        try:
            df = pd.read_csv(self.base_path / file_path)
            # Group by country using precise column names found in the audit
            df_grouped = df.groupby(group_col)[value_col].mean().reset_index()
            
            # Simple scaling to 0-100 index for easier blending downstream
            scaler = MinMaxScaler(feature_range=(0, 100))
            df_grouped[rename_col] = scaler.fit_transform(df_grouped[[value_col]])
            
            # Standardize country name to ensure merging works
            df_grouped['country_std'] = df_grouped[group_col].astype(str).str.strip().str.title()
            
            # Hardcoded fix for some common mismatches
            df_grouped.loc[df_grouped['country_std'] == 'United States Of America', 'country_std'] = 'United States'
            df_grouped.loc[df_grouped['country_std'] == 'United Kingdom Of Great Britain And Northern Ireland', 'country_std'] = 'United Kingdom'
            df_grouped.loc[df_grouped['country_std'] == 'South Korea', 'country_std'] = 'Korea'
            
            return df_grouped[['country_std', rename_col]]
        except Exception as e:
            print(f"  ⚠️ Warning: Could not process {file_path}: {e}")
            return pd.DataFrame(columns=['country_std', rename_col])

    def append_context_features(self, df):
        df = df.copy()
        print("  📊 Extracting real Stanford context metrics...")
        
        # 1. Policy density framework (Real data from step 1)
        domain_counts = df['domain'].value_counts().to_dict()
        total_policies = len(df)
        df['policy_density_context'] = df['domain'].map(
            lambda d: domain_counts.get(d, 0) / total_policies
        )
        
        # Ensure we have a standard country column for merging
        # The parser gave us "United States" implicitly for the Stanford surveys and 
        # actual countries for OECD. We impute US for Stanford polls as they were 
        # local US official polls.
        df['country_std'] = df['country'].fillna('United States').astype(str).str.strip().str.title()
        
        # 2. Economic Pressure Context (fig_4.2.1: AI job postings)
        econ_df = self._load_and_scale_proxy(
            "4. Economy/Data/fig_4.2.1.csv", 
            "Geographic area", 
            "AI job postings (% of all job postings)", 
            "economic_pressure_context"
        )
        
        # 3. Education Readiness Context (fig_7.3.13: CS Grads Demographics proxy)
        # Assuming volume correlates with gender representation data density; 
        # Alternatively, fig_7.3.9 is raw counts. Let's use 7.3.9.
        edu_df = self._load_and_scale_proxy(
            "7. Education/Data/fig_7.3.9.csv", 
            "Country", 
            "Number of new  ICT short-cycle tertiary graduates", 
            "education_readiness_context"
        )
        
        # 4. Policy Action Readiness (fig_6.2.1: Number of bills)
        pol_df = self._load_and_scale_proxy(
            "6. Policy and Governance/Data/fig_6.2.1.csv", 
            "Geographic area", 
            "Number of AI-related bills passed into law, 2016-24", 
            "policy_action_context"
        )
        
        # Merge all contexts securely
        df = pd.merge(df, econ_df, on='country_std', how='left')
        df = pd.merge(df, edu_df, on='country_std', how='left')
        df = pd.merge(df, pol_df, on='country_std', how='left')
        
        # Impute missing values with global medians to avoid breaking ML models
        median_econ = df['economic_pressure_context'].median() or 50.0
        median_edu = df['education_readiness_context'].median() or 50.0
        median_pol = df['policy_action_context'].median() or 50.0
        
        df['economic_pressure_context'] = df['economic_pressure_context'].fillna(median_econ)
        df['education_readiness_context'] = df['education_readiness_context'].fillna(median_edu)
        df['policy_action_context'] = df['policy_action_context'].fillna(median_pol)
        
        # We no longer need the temporary standardized country col
        df = df.drop(columns=['country_std'])
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
            'policy_density_context', 'economic_pressure_context', 
            'education_readiness_context', 'policy_action_context'
        ]
        
        return df
        
    def validate_and_train(self, df_train):
        """Performs LOOCV validation prior to final training."""
        X = df_train[self.feature_cols].copy()
        y = df_train['support_bucket'].astype(str).values
        
        X_scaled = self.scaler.fit_transform(X)
        
        loo = LeaveOneOut()
        y_true = []
        y_pred = []
        
        # Small sample warning protocol
        print(f"\n  ⚠️  Notice: Executing Leave-One-Out Cross-Validation on small labelled set (n={len(X)})")
        
        for train_index, test_index in loo.split(X_scaled):
            X_cv_train, X_cv_test = X_scaled[train_index], X_scaled[test_index]
            y_cv_train, y_cv_test = y[train_index], y[test_index]
            
            # Use class_weight='balanced_subsample' to handle huge class variations in tiny sets
            clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42, class_weight='balanced')
            clf.fit(X_cv_train, y_cv_train)
            
            y_pred.append(clf.predict(X_cv_test)[0])
            y_true.append(y_cv_test[0])
            
        acc = accuracy_score(y_true, y_pred)
        bal_acc = balanced_accuracy_score(y_true, y_pred)
        cm = confusion_matrix(y_true, y_pred, labels=['High', 'Medium', 'Low'])
        
        print("\n  [Validation Metrics]")
        print(f"  Accuracy:          {acc:.1%}")
        print(f"  Balanced Accuracy: {bal_acc:.1%}")
        print("  Confusion Matrix (High, Medium, Low):")
        for row in cm:
            print(f"    {row}")
        print("  ⚠️ Caveat: Accuracy metrics fluctuate widely on n=15 datasets.")
        print("     This model serves as a heuristic decision-support baseline rather than a definitive predictor.")
        
        # Final Train on all data
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
    print("🏛️  Step 2: Policymaker Support Estimation (Validated)")
    print("="*60)
    
    input_path = Path('data/step1_parsed_policies.csv')
    if not input_path.exists():
        print(f"❌ Error: {input_path} not found. Run step 1 first.")
        sys.exit(1)
        
    print("[1/3] Loading parsed policy data & appending Stanford context...")
    df = pd.read_csv(input_path)
    
    # 1. Append Contextual Features
    context_engine = ContextualFeatureEngine(df)
    df = context_engine.append_context_features(df)
    
    # 2. Split into Train (Stanford) and Infer (OECD)
    stanford_df = df[df['source'] == 'Stanford'].copy()
    oecd_df = df[df['source'] == 'OECD'].copy()
    
    print(f"  ✓ Training set: {len(stanford_df)} labeled Stanford policies")
    print(f"  ✓ Inference set: {len(oecd_df)} unlabeled OECD policies")
    
    print("\n[2/3] Validating & Training Support Estimator (LOOCV)...")
    estimator = SupportEstimator()
    stanford_df = estimator.prepare_data(stanford_df)
    estimator.validate_and_train(stanford_df)
    
    print("\n[Feature Importance for Policymaker Support]")
    fi = estimator.get_feature_importance()
    for _, row in fi.head(5).iterrows():
        bar = "█" * int(row['Importance'] * 30)
        print(f"  {row['Feature']:30s} {bar} {row['Importance']:.3f}")
        
    print("\n[3/3] Estimating Support for OECD Policy Corpus...")
    oecd_df = estimator.predict_support(oecd_df)
    
    # Combine back to save full dataset with estimates
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

