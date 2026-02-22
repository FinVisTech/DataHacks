"""Quick test to verify data loading and basic functionality."""
import sys
from pathlib import Path

try:
    import pandas as pd
    import numpy as np
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.metrics import accuracy_score, classification_report
    print("✓ All imports successful")
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)

BASE = Path("data/PUBLIC DATA_ 2025 AI Index Report")

try:
    # Test data loading
    opinion = pd.read_csv(BASE / "8. Public Opinion/Data/fig_8.2.2.csv")
    print(f"✓ Loaded public opinion data: {len(opinion)} rows")
    
    regulations = pd.read_csv(BASE / "6. Policy and Governance/Data/fig_6.2.20.csv")
    print(f"✓ Loaded regulations data: {len(regulations)} rows")
    
    bills = pd.read_csv(BASE / "6. Policy and Governance/Data/fig_6.2.1.csv")
    print(f"✓ Loaded bills data: {len(bills)} rows")
    
    print("\n✓ All data files loaded successfully!")
    print("\nReady to run full backend. Execute: python policy_alignment_backend.py")
    
except Exception as e:
    print(f"✗ Error loading data: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
