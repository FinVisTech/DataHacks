# Data Pipeline Flowcharts

## Complete Backend Pipeline

```mermaid
flowchart TD
    A[Start] --> B["Load CSVs<br/>fig_8.2.2 Public Opinion<br/>fig_6.2.20 US Regulations<br/>fig_6.2.1 Country Bills"]
    
    B --> C["Aggregate Public Opinion<br/>per Policy"]
    C --> C1["For each Policy:<br/>Agree percent<br/>Neutral percent<br/>Disagree percent"]
    
    C1 --> D["Feature Engineering<br/>per Policy"]
    D --> D1["Compute Metrics:<br/>support_score = Agree - Disagree<br/>consensus_score = Agree + Neutral"]
    D --> D2["Classify Domain:<br/>Privacy / Employment / Economic / Legal / Tech / Social / Other"]
    D --> D3["Text Flags:<br/>is_privacy, is_employment,<br/>is_economic, is_legal,<br/>is_tech, is_social,<br/>has_ban, has_regulation,<br/>word_count"]
    
    B --> E["Map Policies to<br/>Regulatory Activity"]
    E --> E1["Keyword-match Policy to Agencies"]
    E1 --> E2["Sum Number of AI-related<br/>Regulations for those Agencies"]
    E2 --> E3["regulation_count<br/>per Policy"]
    
    D1 --> F["Policy Feature Table<br/>one row per Policy"]
    D2 --> F
    D3 --> F
    E3 --> F
    
    F --> G["Create Support Labels<br/>Low/Medium/High<br/>based on Agree percent bins"]
    G --> H["Train Random Forest<br/>Support Classifier"]
    H --> H1["Outputs:<br/>predicted_support_level<br/>probabilities<br/>feature_importance"]
    
    F --> I["Fit Alignment Scorer<br/>on Agree percent and regulation_count"]
    I --> I1["Compute Alignment Score<br/>for each Policy:<br/>norm Agree - norm Reg Count"]
    I1 --> I2["Alignment Category:<br/>Policy Gap / Aligned / Over-Regulated"]
    
    F --> J["Train Gradient Boosting<br/>Regulation Predictor"]
    J --> J1["Outputs:<br/>predicted_regulation_prob<br/>predicted_will_be_regulated"]
    
    H1 --> K["Save Models and Results<br/>pkl files, CSV"]
    I2 --> K
    J1 --> K
    K --> L["Used by Dashboard<br/>visuals and predictions"]
```

---

## Model 1: Policy Support Classification (Detailed)

```mermaid
flowchart TD
    A["Public Opinion CSV<br/>fig_8.2.2"] --> B["Group by Policy"]
    
    B --> C["For each Policy:<br/>extract rows where<br/>Label = Agree / Neither / Disagree"]
    C --> D["Compute per-Policy Stats"]
    D --> D1["agree_pct"]
    D --> D2["neutral_pct"]
    D --> D3["disagree_pct"]
    D --> D4["support_score = agree_pct - disagree_pct"]
    D --> D5["consensus_score = agree_pct + neutral_pct"]
    
    C --> E["Policy Text"]
    E --> F["Domain and Keyword Features"]
    F --> F1["domain: Privacy/Employment/Economic/Legal/Tech/Social"]
    F --> F2["is_privacy, is_employment,<br/>is_economic, is_legal,<br/>is_tech, is_social"]
    F --> F3["has_ban, has_regulation,<br/>word_count"]
    
    D1 --> G["Build Feature Matrix X<br/>14 features total"]
    D2 --> G
    D3 --> G
    D4 --> G
    D5 --> G
    F1 --> G
    F2 --> G
    F3 --> G
    
    D1 --> H["Create Target y:<br/>support_level via bins:<br/>0-40 = Low<br/>40-60 = Medium<br/>60-100 = High"]
    
    G --> I["Train/Test Split<br/>80% train, 20% test"]
    H --> I
    I --> J["Scale Features<br/>StandardScaler"]
    J --> K["Train Random Forest<br/>Classifier: 100 trees, max_depth 5"]
    K --> L["Evaluate<br/>Accuracy and Classification Report"]
    K --> M["Predict support_level<br/>plus probabilities<br/>plus feature_importance"]
```

---

## Simplified High-Level View

```mermaid
flowchart LR
    A["CSV Files"] --> B["Data Loading"]
    B --> C["Feature Engineering"]
    C --> D["Model Training"]
    D --> E["Predictions"]
    E --> F["Dashboard"]
    
    B --> B1["Public Opinion<br/>15 policies"]
    B --> B2["US Regulations<br/>by agency"]
    B --> B3["Country Bills<br/>by country"]
    
    C --> C1["Support Metrics"]
    C --> C2["Policy Domain"]
    C --> C3["Text Features"]
    
    D --> D1["Support Classifier<br/>Random Forest"]
    D --> D2["Alignment Scorer<br/>Statistical"]
    D --> D3["Regulation Predictor<br/>Gradient Boosting"]
    
    E --> E1["Support Level<br/>High/Medium/Low"]
    E --> E2["Alignment Score<br/>Gap/Aligned/Over-Reg"]
    E --> E3["Regulation Probability"]
```

---

## Alternative: ASCII Flowchart (if Mermaid still has issues)

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE OVERVIEW                    │
└─────────────────────────────────────────────────────────────┘

1. DATA LOADING
   ├─ fig_8.2.2.csv (Public Opinion)
   │  └─ 15 policies × 3 labels = 45 rows
   ├─ fig_6.2.20.csv (US Regulations)
   │  └─ Regulations by agency and year
   └─ fig_6.2.1.csv (Country Bills)
      └─ Bills passed by country (2016-24)

2. FEATURE ENGINEERING
   ├─ Per Policy:
   │  ├─ agree_pct, neutral_pct, disagree_pct
   │  ├─ support_score = agree_pct - disagree_pct
   │  ├─ consensus_score = agree_pct + neutral_pct
   │  ├─ domain (Privacy/Employment/Economic/Legal/Tech/Social)
   │  └─ Binary flags (is_privacy, is_employment, etc.)
   └─ Regulatory Activity:
      └─ regulation_count (from keyword matching)

3. MODEL TRAINING
   ├─ Model 1: Support Classifier
   │  ├─ Algorithm: Random Forest (100 trees)
   │  ├─ Input: 14 features
   │  ├─ Output: High/Medium/Low support level
   │  └─ Target: Binned agree_pct (0-40=Low, 40-60=Med, 60-100=High)
   │
   ├─ Model 2: Alignment Scorer
   │  ├─ Algorithm: Normalized score calculation
   │  ├─ Formula: norm(agree_pct) - norm(regulation_count)
   │  └─ Output: Policy Gap / Aligned / Over-Regulated
   │
   └─ Model 3: Regulation Predictor
      ├─ Algorithm: Gradient Boosting
      ├─ Input: 14 features
      └─ Output: Probability of regulation (0-1)

4. PREDICTIONS & OUTPUTS
   ├─ policy_alignment_data.csv (all predictions)
   ├─ policy_support_model.pkl (saved model)
   └─ regulation_predictor_model.pkl (saved model)

5. DASHBOARD USAGE
   └─ Visualizations and interactive predictions
```
