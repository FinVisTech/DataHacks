# Module Structure Explanation

## Overview

The project is now organized into separate modules for better maintainability and clarity.

---

## Module Breakdown

### 1. **`data_processor.py`** - Data Loading & Feature Engineering
**Purpose**: Handles all data operations

**Classes**:
- `PolicyDataProcessor`: Loads CSVs, creates features, maps regulations

**Key Functions**:
- `load_data()`: Loads 3 CSV files
- `create_policy_features()`: Creates 14 features per policy
- `_classify_policy_domain()`: Classifies domain using keyword matching
- `get_regulatory_activity()`: Maps policies to agency regulations

**What it does**:
- Loads public opinion, regulations, and bills CSVs
- Aggregates opinion data per policy (Agree/Neutral/Disagree %)
- Classifies policy domain (Privacy, Employment, Economic, etc.)
- Creates binary flags (is_privacy, is_employment, etc.)
- Calculates support metrics (support_score, consensus_score)
- Maps policies to regulatory activity via keyword matching

---

### 2. **`model_support_classifier.py`** - Model 1
**Purpose**: Predicts High/Medium/Low public support

**Classes**:
- `PolicySupportClassifier`: Random Forest classifier

**Key Functions**:
- `prepare_features()`: Creates feature matrix and labels
- `train()`: Trains Random Forest model
- `predict()`: Predicts support level
- `predict_proba()`: Gets probability distribution
- `get_feature_importance()`: Returns feature importance scores

**What it does**:
- Creates support level labels from agree_pct bins (0-40=Low, 40-60=Medium, 60-100=High)
- Trains Random Forest (100 trees, max_depth=5)
- Predicts support level for policies
- Provides feature importance for interpretability

---

### 3. **`model_alignment_scorer.py`** - Model 2
**Purpose**: Calculates alignment between support and regulation

**Classes**:
- `AlignmentScorer`: Statistical scorer (not ML)

**Key Functions**:
- `fit()`: Fits normalization parameters
- `calculate_alignment()`: Computes alignment score and category

**What it does**:
- Normalizes support % and regulation count to 0-1 scale
- Calculates: `alignment_score = norm(support) - norm(regulation)`
- Categorizes: Policy Gap / Aligned / Over-Regulated

---

### 4. **`model_regulation_predictor.py`** - Model 3
**Purpose**: Predicts likelihood of regulation

**Classes**:
- `RegulationPredictor`: Gradient Boosting classifier

**Key Functions**:
- `prepare_features()`: Creates binary target (has_regulation)
- `train()`: Trains Gradient Boosting model
- `predict()`: Predicts regulation (0/1)
- `predict_proba()`: Gets probability of regulation

**What it does**:
- Creates binary target: regulation_count > 0?
- Trains Gradient Boosting (100 trees, max_depth=3)
- Handles small datasets (checks if stratification possible)
- Predicts probability of regulation



## How Domain Classification Works

See `docs/DOMAIN_CLASSIFICATION_EXPLANATION.md` for detailed explanation.

**Quick Summary**:
- Uses sequential keyword matching (if/elif chain)
- Priority order: Privacy → Employment → Economic → Legal → Tech → Social → Other
- First match wins
- Example: "Bias audits for hiring" → Employment (matches "hiring" before "regulation")

---

## How Binary Flags Work

**Quick Summary**:
- Simple keyword presence check (case-insensitive)
- Multiple flags can be 1 for same policy
- Examples:
  - `is_privacy`: checks for "privacy" OR "data"
  - `is_employment`: checks for "hiring", "unemployed", "retraining", "wage"
  - `has_ban`: checks for "ban"
  - `has_regulation`: checks for "regulation"

See `docs/DOMAIN_CLASSIFICATION_EXPLANATION.md` for full details.

---

## Benefits of This Structure

1. **Modularity**: Each component is separate and testable
2. **Maintainability**: Easy to update one model without affecting others
3. **Clarity**: Clear separation of concerns
4. **Reusability**: Can import individual models for other projects
5. **Documentation**: Each module is self-contained with clear purpose

---

## Usage

```python
# Import individual modules for integration
from data_processor import PolicyDataProcessor
from model_support_classifier import PolicySupportClassifier
from model_alignment_scorer import AlignmentScorer
from model_regulation_predictor import RegulationPredictor
```
