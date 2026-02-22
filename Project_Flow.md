# AI Civic Alignment System: Detailed Architecture

This document contains a high-level overview of the entire system, followed by detailed, component-level Mermaid flowcharts for each of the 5 pipeline steps.

---

## High-Level System Overview

```mermaid
graph TD
    A[(Stanford Data)] & B[(OECD Data)] --> S1[Step 1: Policy Parser]
    S1 -->|Unified Corpus| S2[Step 2: Support Estimator]
    S2 -->|Estimates| S3[Step 3: Alignment Engine]
    S2 -->|Timelines| S4[Step 4: Momentum Forecast]
    S3 -->|Gap Metrics| S4
    
    User[User Custom Policy] --> S5[Step 5: Civic Translator]
    S1 -.->|OECD Precedents| S5
    S2 -.->|RF Model| S5
    S3 -.->|Alignment Context| S5
```

---

## Detailed Step Breakdowns

### Step 1: Policy Parsing Engine
The data ingestion and NLP tagging layer to build a unified corpus.

```mermaid
graph TD
    subgraph Data Sources
        D1[(Stanford AI Index<br/>Opinion & Regulation CSVs)]
        D2[(OECD.AI Policy Navigator<br/>Raw Data Extractor)]
    end
    
    subgraph Parsing Engine
        P1[Data Loader & Text Cleaning]
        D1 --> P1
        D2 --> P1
        
        P1 --> NLP{HuggingFace NLP API<br/>Zero-Shot Classifier}
        NLP -->|Domain| C1[Domain Class Mapping<br/>e.g. Privacy, Tech, Economy]
        NLP -->|Fallback| C2[Keyword/Heuristic<br/>Matcher]
        
        P1 --> FE[Feature Extraction]
        FE -->|Binary Flags| F1(is_tech, is_privacy, etc.)
        FE -->|Stakeholders| F2(Labor, Education, Business)
    end
    
    C1 --> M[Data Merger & Formatter]
    C2 --> M
    F1 --> M
    F2 --> M
    
    M -->|Output| Out1[(data/step1_parsed_policies.csv)]
    
    style NLP fill:#e1bee7,stroke:#4a148c
    style Out1 fill:#e8f5e9,stroke:#1b5e20
```

---

### Step 2: Policymaker Support Estimation
The supervised ML module that learns from Stanford data to predict on OECD data.

```mermaid
graph TD
    In1[(data/step1_parsed_policies.csv)] --> S[Splitter]
    
    subgraph Support Estimation Module
        S -->|Stanford Corpus<br/>With Sentiment Labels| TrainData
        S -->|OECD Corpus<br/>Unlabeled| InferData
        
        TrainData --> CX[Contextual Feature Engine]
        InferData --> CX
        
        CX -->|Adds: Policy Density<br/>Economic Pressure<br/>Education Readiness| Pre[Preprocessor]
        
        Pre -->|Label Encoding &<br/>Standard Scaling| Model{Random Forest<br/>Classifier}
        Model -->|Cross Validation| FI[Feature Importance<br/>Extract]
    end
    
    Model -->|Predict on Stanford| OutTrain[Stanford Estimates]
    Model -->|Predict on OECD| OutInfer[OECD Estimates]
    
    OutTrain & OutInfer --> Out2[(data/step2_estimated_policies.csv)]
    Model --> Out3[models/step2_support_estimator.pkl]
    
    style Model fill:#bbdefb,stroke:#0d47a1
    style Out2 fill:#e8f5e9,stroke:#1b5e20
```

---

### Step 3: Alignment Engine (Core Gap Analysis)
The centerpiece of the platform. Computes misalignment gaps and runs unsupervised diagnostic models.

```mermaid
graph TD
    In2[(data/step2_estimated_policies.csv)] --> G1[Group by Domain]
    
    subgraph Alignment Engine
        G1 --> M1[Compute Base Indices]
        M1 --> I1(Citizen Sentiment Index)
        M1 --> I2(Policymaker Support Index)
        M1 --> I3(Regulation Intensity Index)
        
        I1 & I2 & I3 --> Gaps[Gap Calculator]
        Gaps --> CPG[Citizen-Policymaker Gap]
        Gaps --> PAG[Policymaker-Action Gap]
        Gaps --> CAG[Citizen-Action Gap]
        
        Gaps --> ML[Machine Learning Diagnostics]
        ML -->|Isolation Forest| Anomaly[Anomaly Detection<br/>Severe Disconnects]
        ML -->|K-Means| Clusters[Archetype Clustering<br/>e.g., Highly Aligned]
    end
    
    Anomaly & Clusters --> Dashboard[Terminal Dashboard]
    Anomaly & Clusters --> Out3[(data/step3_domain_alignment.csv)]
    
    style ML fill:#ffcc80,stroke:#e65100
    style Out3 fill:#e8f5e9,stroke:#1b5e20
```

---

### Step 4: Regulation Momentum Forecast
A time-series and regression engine forecasting regulatory shifts.

```mermaid
graph TD
    In3[(data/step2_estimated_policies.csv)] --> H1[Historical Timeline Extractor]
    In4[(data/step3_domain_alignment.csv)] --> C1[Context Matrix]
    
    subgraph Momentum Engine
        H1 -->|Filter > 2015| R1[Linear Regression Model]
        R1 -->|Slope Coefficient| Gr[Annual Growth Rate]
        
        Gr --> M[Momentum Formula Blending]
        C1 -->|Economic Pressure Index| M
        C1 -->|Citizen Sentiment Index| M
        
        M -->|Weighted Sum| Score[Momentum Priority Score]
        Score --> Classify[Priority Classifier<br/>High / Medium / Low]
        Score --> Warning[Early Warning Signal<br/>High Pressure + Low Precedent]
    end
    
    Classify & Warning --> Out4[(data/step4_momentum_forecast.csv)]
    Classify & Warning --> Dash4[Momentum Dashboard]
    
    style R1 fill:#c8e6c9,stroke:#2e7d32
    style Out4 fill:#e8f5e9,stroke:#1b5e20
```

---

### Step 5: Policy Translator (Civic Interface)
The civic-facing application to democratize understanding of new AI proposals.

```mermaid
graph TD
    User[(Raw Policy Text Input)] --> P[Civic Policy Parser]
    
    subgraph Civic Interface Pipeline
        P --> NLP[NLP Feature & Domain Extraction]
        
        NLP --> Est[Support Inference Engine]
        Model[(models/step2_support_estimator.pkl)] -.-> Est
        Est --> Sup[Estimated Reception / Pushback]
        
        NLP --> Context[Alignment Context Retriever]
        Align[(data/step3_domain_alignment.csv)] -.-> Context
        Context --> Insight[Identify Relevant Disconnects]
        
        NLP --> Sim[Precedent Search Engine]
        OECD[(data/step1_parsed_policies.csv)] -.-> Sim
        Sim -->|TF-IDF Vectorization &<br/>Cosine Similarity| Match[Top Global Precedents]
    end
    
    Sup & Insight & Match --> Output[Terminal Output Explanation]
    
    style Sim fill:#f8bbd0,stroke:#c2185b
    style Est fill:#bbdefb,stroke:#0d47a1
    style Output fill:#fff9c4,stroke:#fbc02d
```
