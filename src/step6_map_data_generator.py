"""
Step 6: Map Data Generator

This utility script aggregates the policy-level results from previous steps
into a single, country-level CSV optimized for interactive maps (e.g. Tableau, 
PowerBI, or Leaflet).

Metrics calculated:
1. AI Policy Count (Density)
2. Average Support Probability (Civic Alignment Index)
3. Top Domain (Strategic Focus)
4. Regulatory Velocity (Growth slope per country)
"""

import pandas as pd
import numpy as np
from pathlib import Path

def main():
    print("="*80)
    print("🌍 Step 6: Map Data Generator (Global Alignment Index)")
    print("="*80)
    
    input_path = Path('data/step2_estimated_policies.csv')
    if not input_path.exists():
        print(f"❌ Error: {input_path} not found. Run previous steps first.")
        return

    df = pd.read_csv(input_path)
    # Only use real countries (exclude Stanford general surveys)
    countries_df = df[df['source'] == 'OECD'].copy()
    
    if len(countries_df) == 0:
        print("❌ Error: No OECD country data found in source.")
        return

    print(f"[1/2] Aggregating metrics for {countries_df['country'].nunique()} countries...")
    
    # 1. Basic counts and averages
    grouped = countries_df.groupby('country').agg({
        'policy_text': 'count',
        'support_probability': 'mean'
    }).rename(columns={
        'policy_text': 'policy_count',
        'support_probability': 'civic_alignment_index'
    })
    
    # Scale Alignment Index to 0-100
    grouped['civic_alignment_index'] = (grouped['civic_alignment_index'] * 100).round(1)
    
    # 2. Find Top Domain (Strategic Focus) per country
    top_domains = countries_df.groupby('country')['domain'].agg(lambda x: x.value_counts().index[0])
    grouped['strategic_focus'] = top_domains
    
    # 3. Calculate Regulatory Velocity (Growth Slope) per country
    print("[2/2] Calculating regulatory velocity trends...")
    velocity_data = []
    for country in countries_df['country'].unique():
        country_policies = countries_df[countries_df['country'] == country].dropna(subset=['year'])
        if len(country_policies) >= 3: # Need some history
            yearly_counts = country_policies.groupby('year').size()
            years = yearly_counts.index.values.reshape(-1, 1)
            counts = yearly_counts.values
            
            # Simple linear regression slope
            from sklearn.linear_model import LinearRegression
            model = LinearRegression()
            model.fit(years, counts)
            velocity = model.coef_[0]
        else:
            velocity = 0.0
        velocity_data.append({'country': country, 'regulatory_velocity': velocity})
    
    velocity_df = pd.DataFrame(velocity_data).set_index('country')
    grouped = grouped.join(velocity_df)
    
    # Normalize Velocity to 0-100 scale
    v_min, v_max = grouped['regulatory_velocity'].min(), grouped['regulatory_velocity'].max()
    if v_max > v_min:
        grouped['velocity_score'] = (100 * (grouped['regulatory_velocity'] - v_min) / (v_max - v_min)).round(1)
    else:
        grouped['velocity_score'] = 50.0

    # Save output
    out_path = 'data/global_map_data.csv'
    grouped.reset_index().to_csv(out_path, index=False)
    
    print(f"\n✅ Success! Map data saved to: {out_path}")
    print(f"📊 Preview of top countries by policy count:")
    print(grouped.sort_values(by='policy_count', ascending=False).head(10))
    print("\n" + "="*80)

if __name__ == "__main__":
    main()
