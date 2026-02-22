# Model 1: Policy Support Classification - Detailed Explanation

## 🎯 Purpose: Empowering Policymakers to Predict Public Approval

**The Problem**: When drafting new AI legislation, policymakers need to know: "Will the public support this policy?"

**The Solution**: Model 1 learns patterns from **previous legislation** and **historical public sentiment** to predict support levels for **future AI policies**.

---

## 📥 EXACT INPUTS

### **Input 1: Policy Text** (What the policymaker provides)
A new AI policy proposal, for example:
- "Mandatory AI transparency requirements for healthcare algorithms"
- "Federal ban on AI-powered surveillance in public spaces"
- "Subsidies for small businesses adopting AI tools"

### **Input 2: Historical Training Data** (What the model learned from)
The model was trained on **16 existing AI policies** with known public support levels:

| Policy Name | Agree % | Neutral % | Disagree % | Actual Support Level |
|-------------|---------|-----------|------------|---------------------|
| Stricter data privacy regulations | 80.4% | 9.5% | 10.1% | **High** |
| Retraining for unemployed | 76.2% | 14.0% | 9.8% | **High** |
| AI deployment regulations | 72.5% | 14.5% | 13.0% | **High** |
| Robot tax | 42.4% | 22.3% | 35.3% | **Medium** |
| Universal basic income | 24.6% | 17.1% | 58.3% | **Low** |
| ... | ... | ... | ... | ... |

---

## 🔧 HOW THE MODEL PROCESSES INPUTS

### **Step 1: Feature Extraction** (Automatic)

When a policymaker inputs a new policy, the model automatically extracts **14 features**:

#### **Feature Group 1: Support Metrics** (estimated from similar policies)
```python
# For a NEW policy, these are estimated from similar historical policies
neutral_pct: 14.5        # Estimated from average neutral % for similar domain policies
disagree_pct: 13.0      # Estimated from average disagree % for similar domain policies
support_score: 59.5     # Estimated: agree_pct - disagree_pct (net support)
consensus_score: 87.0   # Estimated: agree_pct + neutral_pct (non-opposition)

# NOTE: For a new policy, we estimate these by:
# 1. Finding similar policies (same domain, similar keywords)
# 2. Taking average neutral_pct and disagree_pct from those similar policies
# 3. Using those averages as features for prediction
```

#### **Feature Group 2: Policy Domain** (from text analysis)
```python
domain_encoded: 1        # Encoded as: Privacy=0, Employment=1, Economic=2, etc.
                          # Determined by keyword matching in policy text
```

#### **Feature Group 3: Policy Characteristics** (Binary flags from text)
```python
is_privacy: 1            # 1 if policy contains "privacy" or "data"
is_employment: 0         # 1 if contains "hiring", "unemployed", "retraining", "wage"
is_economic: 0           # 1 if contains "tax", "subsidy", "antitrust", "income"
is_legal: 1              # 1 if contains "regulation", "ban", "sentencing", "parole"
is_tech: 1               # 1 if contains "ai", "hardware", "semiconductor", "facial"
is_social: 0             # 1 if contains "safety net", "basic income"
has_ban: 0               # 1 if policy text includes the word "ban"
has_regulation: 1        # 1 if text includes "regulation"
word_count: 6            # Number of words in policy name
```

**Example**: For policy "Stricter data privacy regulations":
- `is_privacy = 1` (contains "privacy")
- `is_legal = 1` (contains "regulation")
- `domain_encoded = 0` (classified as "Privacy" domain)
- `word_count = 4`

---

## 🧠 HOW THE MODEL ANALYZES

### **Algorithm: Random Forest Classifier**

**What it does**: Creates an "ensemble" of 100 decision trees, each learning different patterns from the training data.

**How it learns**:
1. **Training Phase**: 
   - Analyzes the 16 historical policies
   - Learns patterns like: "Privacy policies with 'regulation' keyword → High support (80%+)"
   - Learns: "Policies with 'ban' keyword → Lower support (34-54%)"
   - Learns: "Employment policies → Medium-High support (51-76%)"

2. **Pattern Recognition**:
   - **Privacy domain** + **has_regulation** → Strong predictor of High support
   - **is_social** + **word_count > 5** → Predictor of Low support
   - **support_score > 50** → Predictor of High support

3. **Decision Making**:
   - Each tree votes on the support level (High/Medium/Low)
   - Final prediction = majority vote across all 100 trees
   - Provides confidence scores (probabilities)

---

## 📤 EXACT OUTPUTS

### **Output 1: Predicted Support Level** (Primary)
```
"High" | "Medium" | "Low"
```

**What it means**:
- **High**: Expected public support >60% (based on historical patterns)
- **Medium**: Expected public support 40-60%
- **Low**: Expected public support <40%

### **Output 2: Probability Distribution** (Confidence scores)
```python
{
    "High": 0.78,      # 78% confidence it's High support
    "Medium": 0.18,   # 18% confidence it's Medium
    "Low": 0.04       # 4% confidence it's Low
}
```

**What it means**: The model is **78% confident** this policy will have High public support.

### **Output 3: Feature Importance** (Interpretability)
```python
{
    "support_score": 0.25,        # Most important predictor
    "is_privacy": 0.18,           # Privacy policies → higher support
    "consensus_score": 0.15,      # Non-opposition matters
    "is_legal": 0.12,             # Legal/governance policies
    "domain_encoded": 0.10,       # Policy domain matters
    ...
}
```

**What it means**: Shows policymakers **which characteristics** drive public support.

---

## 💡 REAL-WORLD EXAMPLE FOR POLICYMAKERS

### **Scenario**: A policymaker is drafting a new bill

**Input**: 
```
Policy: "Mandatory AI bias audits for financial services"
```

**Model Processing**:
1. Extracts features:
   - `is_legal = 1` (contains "audits")
   - `is_economic = 1` (contains "financial")
   - `domain_encoded = 2` (Economic domain)
   - `has_regulation = 0` (no "regulation" keyword)
   - `word_count = 6`

2. Compares to historical patterns:
   - Similar policy: "Bias audits for hiring and promotion AI" → 51.7% support (Medium)
   - Privacy policies → Higher support
   - Economic policies → Moderate support

3. Makes prediction:
   - **Predicted Support Level**: "Medium"
   - **Confidence**: 65% Medium, 25% High, 10% Low
   - **Key Factors**: Economic domain, legal characteristic

**Output to Policymaker**:
```
Predicted Support: MEDIUM (65% confidence)
Expected Public Approval: ~50-55%

Key Insights:
- Similar policies (bias audits) have received moderate support (51.7%)
- Economic/legal policies tend to have medium-high support
- Consider emphasizing privacy aspects to increase support
```

---

## 🔍 HOW IT HELPS POLICYMAKERS

### **1. Pre-Drafting Phase**
**Question**: "Should I prioritize this policy?"
- **Input**: Policy concept
- **Output**: Predicted support level
- **Action**: Focus on policies with predicted High/Medium support

### **2. Drafting Phase**
**Question**: "How can I increase public support?"
- **Input**: Policy draft
- **Output**: Feature importance shows what drives support
- **Action**: Emphasize high-impact characteristics (e.g., privacy aspects)

### **3. Refinement Phase**
**Question**: "Will this wording change support?"
- **Input**: Policy variations
- **Output**: Compare predicted support levels
- **Action**: Choose wording that maximizes predicted support

### **4. Strategic Planning**
**Question**: "Which policies should we prioritize?"
- **Input**: Multiple policy proposals
- **Output**: Ranked by predicted support
- **Action**: Focus legislative resources on high-support policies

---

## 📊 TRAINING DATA SOURCES

The model learns from:

1. **Public Opinion Survey** (fig_8.2.2.csv)
   - 16 AI policies
   - % Agree, % Neutral, % Disagree for each
   - Used to create support level labels (High/Medium/Low)

2. **Historical Patterns**
   - Privacy policies → Higher support (80%+)
   - Employment policies → Medium-High support (51-76%)
   - Economic policies → Variable support (42-58%)
   - Social policies → Lower support (24-46%)

3. **Policy Characteristics**
   - Policies with "regulation" keyword → Higher support
   - Policies with "ban" keyword → Lower support
   - Shorter policy names → Slightly higher support

---

## 🎯 KEY INSIGHTS FOR POLICYMAKERS

### **What the Model Learned**:

1. **Privacy is Popular**: Privacy-related policies consistently receive 70-80% support
   - **Action**: Frame policies in privacy terms when possible

2. **Employment Policies Resonate**: Retraining, bias audits → 51-76% support
   - **Action**: Emphasize employment/economic benefits

3. **Bans are Controversial**: Policies with "ban" → Lower support (34-42%)
   - **Action**: Use "regulation" instead of "ban" when possible

4. **Domain Matters**: Policy domain (Privacy, Employment, Economic) is a strong predictor
   - **Action**: Consider domain when drafting

5. **Support Score is Key**: Net support (Agree - Disagree) is the strongest predictor
   - **Action**: Focus on policies that minimize opposition

---

## 🔬 TECHNICAL DETAILS

### **Model Architecture**:
- **Algorithm**: Random Forest Classifier
- **Trees**: 100 decision trees
- **Max Depth**: 5 levels (prevents overfitting)
- **Class Weight**: Balanced (handles imbalanced classes)

### **Feature Engineering**:
- **14 features** total
- **Normalization**: StandardScaler (all features scaled to same range)
- **Domain Encoding**: LabelEncoder (Privacy=0, Employment=1, etc.)

### **Evaluation**:
- **Train/Test Split**: 80% train, 20% test
- **Stratified**: Ensures balanced classes in test set
- **Metrics**: Accuracy, Precision, Recall, F1-score per class

### **Expected Performance**:
- **Accuracy**: ~70-85% (with 16 training samples)
- **Limitation**: Small dataset → Proof-of-concept
- **Value**: Demonstrates methodology, interpretable results

---

## 📈 USE CASE WORKFLOW

### **Complete Workflow for a Policymaker**:

```
1. INPUT: "I'm considering a policy: 'Federal AI transparency requirements'"

2. MODEL PROCESSING:
   - Extracts: is_legal=1, domain=Legal/Governance, word_count=4
   - Compares to historical: Similar policies had 72.5% support
   - Predicts: HIGH support (78% confidence)

3. OUTPUT TO POLICYMAKER:
   "Predicted Support: HIGH
    Expected Approval: ~70-75%
    
    Similar policies (AI deployment regulations) received 72.5% support.
    Legal/governance policies with 'regulation' keyword tend to have high support.
    
    Recommendation: This policy is likely to be well-received by the public."

4. POLICYMAKER ACTION:
   - Proceeds with drafting
   - Emphasizes transparency and regulation aspects
   - Confident in public support
```

---

## ✅ SUMMARY

**Model 1 Inputs**:
- Policy text (new legislation proposal)
- Historical training data (16 policies with known support)

**Model 1 Outputs**:
- Predicted support level (High/Medium/Low)
- Confidence scores (probability distribution)
- Feature importance (what drives support)

**How It Analyzes**:
- Extracts 14 features from policy text
- Compares to historical patterns
- Uses Random Forest (100 decision trees) to predict
- Provides interpretable results

**How It Empowers Policymakers**:
- **Predict** public approval before drafting
- **Optimize** policy wording to maximize support
- **Prioritize** policies with high predicted support
- **Understand** what characteristics drive public approval

**Value Proposition**: 
"Use historical public sentiment and policy characteristics to predict approval of future AI legislation, enabling data-driven policy decisions."
