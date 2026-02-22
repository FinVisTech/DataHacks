"""
Step 4: Regulation Momentum Forecast

This module uses historical policy growth trends combined with 
economic pressure and citizen sentiment to forecast which domains 
will see the most regulatory momentum in the near future.

Outputs:
    - outputs/step4_momentum_indicator.csv
    - Terminal dashboard showing priority domains and early warnings
"""

import pandas as pd
import numpy as np
import warnings
from pathlib import Path
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import MinMaxScaler

warnings.filterwarnings('ignore')

def calculate_historical_growth(policies_df):
    """
    Calculates the year-over-year growth trend of policies 
    for each domain using simple linear regression.
    """
    # Only use OECD data for volume/timeline
    oecd = policies_df[policies_df['source'] == 'OECD'].copy()
    oecd = oecd.dropna(subset=['year'])
    oecd['year'] = oecd['year'].astype(int)
    
    # Filter to recent history (e.g., last 10 years to avoid old outliers)
    recent_years = oecd[oecd['year'] >= 2015]
    
    yearly_counts = recent_years.groupby(['domain', 'year']).size().reset_index(name='count')
    
    growth_rates = {}
    for domain in yearly_counts['domain'].unique():
        domain_data = yearly_counts[yearly_counts['domain'] == domain]
        if len(domain_data) >= 2: # Need at least 2 points for a line
            X = domain_data[['year']].values
            y = domain_data['count'].values
            
            model = LinearRegression()
            model.fit(X, y)
            growth_rates[domain] = model.coef_[0] # Slope represents annual growth
        else:
            growth_rates[domain] = 0.0
            
    return growth_rates

def generate_forecast(domain_df, growth_rates):
    """
    Combines historical growth, economic pressure, and citizen sentiment
    to generate the Momentum Index for each domain.
    """
    forecast = domain_df.copy()
    
    # Add historical growth rate
    forecast['historical_growth_rate'] = forecast['domain'].map(lambda d: growth_rates.get(d, 0.0))
    
    # Scale growth rate to 0-100 for easy blending
    scaler = MinMaxScaler(feature_range=(0, 100))
    if len(forecast) > 1 and forecast['historical_growth_rate'].max() > forecast['historical_growth_rate'].min():
        forecast['growth_index'] = scaler.fit_transform(forecast[['historical_growth_rate']])
    else:
        forecast['growth_index'] = 50.0
        
    # Momentum Engine Formula
    # Momentum = (Historical Growth * 0.4) + (Economic Pressure * 0.4) + (Citizen Sentiment * 0.2)
    # The intuition: regulation grows where there's historical precedent, economic need, and public demand.
    
    forecast['momentum_index'] = (
        forecast['growth_index'] * 0.4 +
        forecast['economic_pressure_index'] * 0.4 +
        forecast['citizen_sentiment_index'] * 0.2
    )
    
    # Determine Priority Classification
    percentiles = np.percentile(forecast['momentum_index'], [33, 66])
    
    def classify_priority(score):
        if score > percentiles[1]: return 'High Priority (Accelerating)'
        elif score > percentiles[0]: return 'Medium Priority (Steady)'
        else: return 'Low Priority (Cooling/Stable)'
        
    forecast['momentum_classification'] = forecast['momentum_index'].apply(classify_priority)
    
    # Early Warning Signals: 
    # High pressure + High Sentiment + Low Historical Growth = Looming shock/breakout
    forecast['early_warning'] = (
        (forecast['economic_pressure_index'] > 75) & 
        (forecast['citizen_sentiment_index'] > 60) & 
        (forecast['growth_index'] < 40)
    )
    
    return forecast.sort_values(by='momentum_index', ascending=False)

def print_indicator_dashboard(forecast_df):
    """Outputs the indicator dashboard to terminal."""
    print("\n" + "=" * 80)
    print("📈 REGULATION MOMENTUM INDICATOR")
    print("=" * 80)
    
    print("\n🔹 PRIORITY DOMAINS (Highest Expected Activity)")
    for _, row in forecast_df.iterrows():
        domain = row['domain'].upper()
        idx = row['momentum_index']
        classification = row['momentum_classification']
        warning = "🚨 EARLY WARNING: Activity Shock Imminent" if row['early_warning'] else ""
        
        bar_len = int(idx / 2)
        bar = "█" * bar_len + "░" * (50 - bar_len)
        
        print(f"\n  {domain:20s}")
        print(f"  Momentum: [{bar}] {idx:.1f}/100")
        print(f"  Outlook:  {classification}")
        if warning:
            print(f"  {warning} (High pressure, low historical precedents)")

def main():
    print("="*80)
    print("🚀 Step 4: Regulation Momentum Indicator")
    print("="*80)
    
    policies_path = Path('data/step2_estimated_policies.csv')
    domain_path = Path('data/step3_domain_alignment.csv')
    
    if not policies_path.exists() or not domain_path.exists():
        print("❌ Error: Previous step outputs not found. Run steps 1-3 first.")
        return
        
    print("[1/3] Loading policy histories and domain alignment matrices...")
    policies_df = pd.read_csv(policies_path)
    domain_df = pd.read_csv(domain_path)
    
    print("[2/3] Analyzing historical growth trends (Regression)...")
    growth_rates = calculate_historical_growth(policies_df)
    
    print("[3/3] Generating momentum indicators and early warning signals...")
    forecast_df = generate_forecast(domain_df, growth_rates)
    
    # Ensure data folder exists
    Path('data').mkdir(exist_ok=True)
    out_path = 'data/step4_momentum_indicator.csv'
    forecast_df.to_csv(out_path, index=False)
    print(f"\n  ✓ Saved momentum indicator data to: {out_path}")
    
    # Display
    print_indicator_dashboard(forecast_df)
    
    print("\n" + "="*80)
    print("✅ Step 4 complete. Next: Proceed to Step 5 (Policy Translator).")
    print("="*80)

if __name__ == "__main__":
    main()
