"""
Step 3: Citizen-Policymaker-Government Alignment Engine

This module serves as the core of the AI Civic Alignment System. It:
1. Aggregates data by domain from Step 2.
2. Computes the 5 core alignment gap metrics.
3. Uses K-Means to cluster domains by alignment archetypes.
4. Uses Isolation Forest to detect severe alignment anomalies (gaps).

Outputs:
    - outputs/step3_domain_alignment.csv (Dashboard data)
    - Terminal dashboard visualization
"""

import pandas as pd
import numpy as np
import warnings
from pathlib import Path
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings('ignore')

def compute_alignment_metrics(df):
    """Aggregates policy data into domain-level indices and gaps."""
    # 1. Map Support Buckets to numeric values for indexing
    support_map = {'Low': 0, 'Medium': 50, 'High': 100}
    df['policymaker_score_num'] = df['estimated_support_bucket'].map(support_map)
    df['policymaker_score_num'] = df['policymaker_score_num'].fillna(50) # fallback
    
    # 2. Aggregate by Domain
    domain_groups = df.groupby('domain')
    
    alignment_data = []
    
    for domain, group in domain_groups:
        # Citizen Sentiment (from Stanford labeled policies mapped to 0-100 scale)
        stanford_subset = group[group['source'] == 'Stanford']
        if len(stanford_subset) > 0:
            # support_score is already conceptually -100 to 100. Shift to 0 to 100.
            raw_sentiment = stanford_subset['support_score'].mean()
            citizen_index = (raw_sentiment + 100) / 2
        else:
            # Fallback to general average if domain wasn't explicitly polled
            citizen_index = 50.0 
            
        # Policymaker Support (Estimated values for all policies)
        policymaker_index = group['policymaker_score_num'].mean()
        
        # Regulation Intensity (Density of policies relative to the max density domain)
        intensity = len(group)
        
        # Context Indices (from feature engine)
        readiness_index = group['education_readiness_context'].mean() * 100
        economic_index = group['economic_pressure_context'].mean() * 100
        
        alignment_data.append({
            'domain': domain,
            'citizen_sentiment_index': citizen_index,
            'policymaker_support_index': policymaker_index,
            'raw_intensity_count': intensity,
            'readiness_index': readiness_index,
            'economic_pressure_index': economic_index
        })
        
    domain_df = pd.DataFrame(alignment_data)
    
    # Normalize Regulation Intensity to 0-100 scale based on relative density
    max_intensity = domain_df['raw_intensity_count'].max()
    domain_df['regulation_intensity_index'] = (domain_df['raw_intensity_count'] / max_intensity) * 100
    
    # 3. Compute Gap Metrics
    # Citizen–Policymaker Gap
    domain_df['citizen_policymaker_gap'] = abs(domain_df['citizen_sentiment_index'] - domain_df['policymaker_support_index'])
    
    # Policymaker–Action Gap
    domain_df['policymaker_action_gap'] = abs(domain_df['policymaker_support_index'] - domain_df['regulation_intensity_index'])
    
    # Citizen–Action Gap
    domain_df['citizen_action_gap'] = abs(domain_df['citizen_sentiment_index'] - domain_df['regulation_intensity_index'])
    
    # Domain Alignment Score (100 = perfect alignment, 0 = total disconnect)
    avg_gap = domain_df[['citizen_policymaker_gap', 'policymaker_action_gap', 'citizen_action_gap']].mean(axis=1)
    domain_df['domain_alignment_score'] = 100 - avg_gap
    
    # Policy Lag Score (Positive = regulation is lagging behind economic pressure)
    domain_df['policy_lag_score'] = domain_df['economic_pressure_index'] - domain_df['regulation_intensity_index']
    
    return domain_df

def apply_machine_learning(domain_df):
    """Applies clustering and anomaly detection to the domain metrics."""
    # Features for ML
    features = ['citizen_sentiment_index', 'policymaker_support_index', 
                'regulation_intensity_index', 'economic_pressure_index']
    
    X = domain_df[features]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # CLUSTERING: Find policy archetypes (e.g. "Over-regulated", "High-Risk/Low-Action", "Aligned")
    # Using k=min(3, num_domains)
    n_clusters = min(3, len(domain_df))
    if n_clusters >= 2:
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        domain_df['cluster_id'] = kmeans.fit_predict(X_scaled)
        
        # Simple heuristic to name clusters based on alignment score
        cluster_means = domain_df.groupby('cluster_id')['domain_alignment_score'].mean()
        cluster_names = {}
        sorted_clusters = cluster_means.sort_values(ascending=False).index
        names = ["Highly Aligned", "Moderately Misaligned", "Severe Disconnect"]
        for i, cid in enumerate(sorted_clusters):
            cluster_names[cid] = names[i] if i < len(names) else f"Cluster {cid}"
            
        domain_df['archetype'] = domain_df['cluster_id'].map(cluster_names)
    else:
        domain_df['archetype'] = "Standard"
        
    # ANOMALY DETECTION: Find highly unusual gap configurations
    # We use Isolation Forest to detect if a specific domain is behaving very differently
    iso = IsolationForest(contamination=0.2, random_state=42)
    domain_df['is_anomaly'] = iso.fit_predict(X_scaled) == -1 # True if anomaly
    
    return domain_df

def print_dashboard(domain_df):
    """Outputs a text-based alignment dashboard."""
    print("\n" + "=" * 80)
    print("📊 AI CIVIC ALIGNMENT DASHBOARD")
    print("=" * 80)
    
    # Sort by alignment score
    df_sorted = domain_df.sort_values('domain_alignment_score', ascending=False)
    
    for _, row in df_sorted.iterrows():
        domain = row['domain']
        score = row['domain_alignment_score']
        lag = row['policy_lag_score']
        archetype = row['archetype']
        anomaly = "⚠️ ANOMALY DETECTED" if row['is_anomaly'] else ""
        
        # Bar chart representation
        bar_len = int(score / 2)
        bar = "█" * bar_len + "░" * (50 - bar_len)
        
        print(f"\n🔹 {domain.upper():20s} {anomaly}")
        print(f"   Alignment Score: [{bar}] {score:.1f}/100")
        print(f"   Archetype:       {archetype}")
        
        # Insights
        if lag > 20:
            print(f"   Insight:         Regulation is significantly lagging behind economic pressure (Lag: +{lag:.1f})")
        elif lag < -20:
            print(f"   Insight:         Regulation outpaces economic necessity (Lag: {lag:.1f})")
            
        gaps = {
            'Citizen vs Policymaker': row['citizen_policymaker_gap'],
            'Policymaker vs Action': row['policymaker_action_gap'],
            'Citizen vs Action': row['citizen_action_gap']
        }
        biggest_gap = max(gaps, key=gaps.get)
        print(f"   Largest Gap:     {biggest_gap} ({gaps[biggest_gap]:.1f})")

def main():
    print("="*80)
    print("⚙️  Step 3: Citizen-Policymaker-Government Alignment Engine")
    print("="*80)
    
    input_path = Path('data/step2_estimated_policies.csv')
    if not input_path.exists():
        print(f"❌ Error: {input_path} not found. Run step 2 first.")
        sys.exit(1)
        
    print("[1/3] Loading estimated policy data...")
    df = pd.read_csv(input_path)
    print(f"  ✓ Loaded {len(df)} policies across {df['domain'].nunique()} domains.")
    
    print("\n[2/3] Computing Alignment Metrics & Gaps...")
    domain_df = compute_alignment_metrics(df)
    
    print("\n[3/3] Running ML Diagnostics (Clustering & Anomaly Detection)...")
    domain_df = apply_machine_learning(domain_df)
    
    # Ensure data folder exists
    Path('data').mkdir(exist_ok=True)
    out_path = 'data/step3_domain_alignment.csv'
    domain_df.to_csv(out_path, index=False)
    print(f"\n  ✓ Saved domain alignment data to: {out_path}")
    
    # Render Dashboard
    print_dashboard(domain_df)
    
    print("\n" + "="*80)
    print("✅ Step 3 complete. Next: Proceed to Step 4 (Momentum Forecast).")
    print("="*80)

if __name__ == "__main__":
    main()
