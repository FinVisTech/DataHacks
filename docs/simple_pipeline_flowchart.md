# Simple Data Pipeline Flowchart

## Version 1: Minimal Syntax (Most Compatible)

```mermaid
flowchart TD
    A[CSV Files] --> B[Load Data]
    B --> C[Feature Engineering]
    C --> D[Train Models]
    D --> E[Generate Predictions]
    E --> F[Dashboard]
    
    B --> B1[Public Opinion]
    B --> B2[US Regulations]
    B --> B3[Country Bills]
    
    C --> C1[Support Metrics]
    C --> C2[Policy Domain]
    C --> C3[Text Features]
    
    D --> D1[Support Classifier]
    D --> D2[Alignment Scorer]
    D --> D3[Regulation Predictor]
```

---

## Version 2: More Detail (Still Simple)

```mermaid
flowchart TD
    Start[Start] --> Load[Load CSV Files]
    
    Load --> Load1[fig_8.2.2 Public Opinion]
    Load --> Load2[fig_6.2.20 US Regulations]
    Load --> Load3[fig_6.2.1 Country Bills]
    
    Load1 --> Process1[Extract per Policy]
    Process1 --> Process1a[Agree percent]
    Process1 --> Process1b[Neutral percent]
    Process1 --> Process1c[Disagree percent]
    
    Process1a --> Features[Create Features]
    Process1b --> Features
    Process1c --> Features
    Load2 --> Features
    
    Features --> Features1[Support Metrics]
    Features --> Features2[Domain Classification]
    Features --> Features3[Keyword Flags]
    
    Features1 --> Model1[Train Support Classifier]
    Features2 --> Model1
    Features3 --> Model1
    
    Features1 --> Model2[Calculate Alignment Score]
    Features2 --> Model2
    
    Features1 --> Model3[Train Regulation Predictor]
    Features2 --> Model3
    Features3 --> Model3
    
    Model1 --> Output[Save Models and Results]
    Model2 --> Output
    Model3 --> Output
    
    Output --> Dashboard[Dashboard Visualization]
```

---

## Version 3: Step-by-Step (Most Detailed)

```mermaid
graph TD
    A[CSV Files] --> B[Step 1: Load Data]
    B --> B1[Public Opinion: 15 policies]
    B --> B2[US Regulations: by agency]
    B --> B3[Country Bills: by country]
    
    B1 --> C[Step 2: Aggregate]
    C --> C1[For each policy get Agree Neutral Disagree]
    
    C1 --> D[Step 3: Feature Engineering]
    D --> D1[Calculate support_score]
    D --> D2[Calculate consensus_score]
    D --> D3[Classify domain]
    D --> D4[Extract keyword flags]
    
    B2 --> E[Step 4: Map Regulations]
    E --> E1[Keyword match policy to agencies]
    E1 --> E2[Count regulations]
    
    D1 --> F[Step 5: Create Feature Table]
    D2 --> F
    D3 --> F
    D4 --> F
    E2 --> F
    
    F --> G[Step 6: Train Models]
    G --> G1[Model 1: Support Classifier]
    G --> G2[Model 2: Alignment Scorer]
    G --> G3[Model 3: Regulation Predictor]
    
    G1 --> H[Step 7: Generate Predictions]
    G2 --> H
    G3 --> H
    
    H --> I[Step 8: Save Results]
    I --> J[Dashboard]
```

---

## If Mermaid Still Doesn't Work: Use This Text Version

```
DATA PIPELINE FLOWCHART
========================

┌─────────────────────────────────────────────────────────┐
│ STEP 1: LOAD DATA                                        │
├─────────────────────────────────────────────────────────┤
│ • fig_8.2.2.csv → Public Opinion (15 policies)         │
│ • fig_6.2.20.csv → US Regulations (by agency/year)     │
│ • fig_6.2.1.csv → Country Bills (by country)           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: AGGREGATE PUBLIC OPINION                        │
├─────────────────────────────────────────────────────────┤
│ For each of 15 policies:                                │
│ • Extract Agree % (from Label='Agree')                  │
│ • Extract Neutral % (from Label='Neither')             │
│ • Extract Disagree % (from Label='Disagree')           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: FEATURE ENGINEERING                             │
├─────────────────────────────────────────────────────────┤
│ Per Policy:                                             │
│ • support_score = agree_pct - disagree_pct              │
│ • consensus_score = agree_pct + neutral_pct            │
│ • domain = classify(Policy text)                        │
│ • is_privacy, is_employment, etc. (binary flags)       │
│ • has_ban, has_regulation (binary flags)               │
│ • word_count = len(Policy.split())                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: MAP REGULATORY ACTIVITY                         │
├─────────────────────────────────────────────────────────┤
│ For each policy:                                        │
│ • Keyword match policy → agencies                      │
│ • Sum regulations from matching agencies               │
│ • Result: regulation_count per policy                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: CREATE FEATURE TABLE                            │
├─────────────────────────────────────────────────────────┤
│ One row per policy with:                                │
│ • 14 features (support metrics, domain, flags)       │
│ • regulation_count                                     │
│ • Target: support_level (Low/Medium/High)              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 6: TRAIN MODELS                                     │
├─────────────────────────────────────────────────────────┤
│ Model 1: Support Classifier                            │
│ • Algorithm: Random Forest (100 trees)                │
│ • Input: 14 features                                  │
│ • Output: High/Medium/Low                             │
│                                                         │
│ Model 2: Alignment Scorer                              │
│ • Algorithm: Normalized score calculation             │
│ • Formula: norm(agree_pct) - norm(regulation_count)  │
│ • Output: Policy Gap / Aligned / Over-Regulated       │
│                                                         │
│ Model 3: Regulation Predictor                         │
│ • Algorithm: Gradient Boosting                        │
│ • Input: 14 features                                  │
│ • Output: Probability of regulation (0-1)              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 7: GENERATE PREDICTIONS                            │
├─────────────────────────────────────────────────────────┤
│ • predicted_support_level                             │
│ • alignment_score and alignment_category              │
│ • predicted_regulation_prob                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 8: SAVE RESULTS                                     │
├─────────────────────────────────────────────────────────┤
│ • policy_alignment_data.csv                            │
│ • policy_support_model.pkl                             │
│ • regulation_predictor_model.pkl                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                    [Dashboard]
```
