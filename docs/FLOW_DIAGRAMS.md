# AI Civic Alignment System: Workflow Visualizations

You can paste the code blocks below directly into [Mermaid Live Editor](https://mermaid.live/) to generate high-resolution diagrams for your presentation slides.

## 1. High-Level Conceptual Overview
*Describes the flow from raw global data to civic impact.*

```mermaid
graph TD
    subgraph Data_Sources [Global Data Ingestion]
        S1[(Stanford AI Index 2025)]
        S2[(OECD.AI / STIP API)]
    end

    subgraph Analytical_Engine [The AI Alignment Pipeine]
        P1[NLP Parsing & Classification]
        P2[ML Support Estimation]
        P3[Civic-Policy Gap Analysis]
        P4[Regulatory Momentum Forecasting]
    end

    subgraph User_Interface [Civic & Policy Outputs]
        O1[Interactive Global Map]
        O2[Policy Translator Interface]
        O3[Alignment Archetype Dashboard]
    end

    S1 --> P1
    S2 --> P1
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> O1
    P4 --> O2
    P4 --> O3
```

---

## 2. Detailed Technical Pipeline & Data Flow
*A deep dive into the ML architecture, data transformations, and the interactive frontend payload path.*

```mermaid
flowchart TD
    %% Global Data Ingestion
    subgraph Offline_Pipeline [Offline Pre-Computation Pipeline]
        direction TB
        subgraph Step1 [Step 1: NLP Extraction]
            Raw[OECD.AI Policies & Stanford CSVs] --> NLP(Hugging Face BART-large-mnli<br><i>Zero-Shot NLP Classifier</i>)
            NLP --> S1_Out[(step1_parsed_policies.csv)]
        end

        subgraph Step2 [Step 2: Predictive Modeling]
            S1_Out --> Context(Contextual Features:<br>Economic Pressure, Education Readiness)
            Context --> LOOCV(Leave-One-Out Cross-Validation)
            LOOCV --> RF[Random Forest Classifier<br><i>Predicts Policymaker Support</i>]
            RF --> S2_Out[(models/step2_support_estimator.pkl)]
            RF --> S2_Data[(step2_estimated_policies.csv)]
        end

        subgraph Step3_4 [Steps 3 & 4: Unsupervised Learning & Forecasting]
            S2_Data --> KMEANS[K-Means Clustering<br><i>Domain Archetype Generation</i>]
            S2_Data --> ISOFOREST[Isolation Forest<br><i>Outlier/Anomaly Detection</i>]
            S2_Data --> LINREG[Linear Regression<br><i>Historical Momentum Slope</i>]
            KMEANS --> S3_Out[(step3_domain_alignment.csv)]
            ISOFOREST --> S3_Out
            LINREG --> S4_Out[(step4_momentum_forecast.csv)]
        end
        
        subgraph Step6 [Step 6: Global Map Aggregation]
            S3_Out --> AGG(Country-Level Aggregation)
            S4_Out --> AGG
            AGG --> S6_Out[(global_map_data.csv - Static Map Feed)]
        end
    end

    %% User Interactive Pipeline
    subgraph Interactive_App [User Interactive Flow]
        direction TB
        UserInput[User Enters Policy Text in Frontend] --> Backend_API(Step 5: Policy Translator)
        
        Backend_API --> Dynamic_NLP(On-the-fly Domain & Stakeholder Classification via HF API)
        
        Backend_API --> Context_Lookup(Pull Archetype & Gap Data<br><i>from step3_domain_alignment.csv</i>)
        Dynamic_NLP --> Context_Lookup
        
        Context_Lookup -.-> Predict(Feed into Random Forest .pkl)
        Predict --> Probs(Confidence & Likelihood Probabilities)
        
        Backend_API --> TFIDF(TF-IDF Vectorizer + Cosine Similarity)
        TFIDF --> DomainBonus(Composite Similarity Engine<br><i>+30% Domain, +20% Stakeholder Bonus</i>)
        DomainBonus --> Similar[Top Functional Precedents from OECD]
        
        %% Response Packaging
        Probs --> JSON_Payload
        Similar --> JSON_Payload
        Context_Lookup --> JSON_Payload
        Dynamic_NLP --> JSON_Payload
        
        JSON_Payload{JSON Payload Response Sent to Frontend} --> DASHBOARD(React/Next.js UI)
    end

    %% Styling
    style Offline_Pipeline fill:#f4f4f4,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style Interactive_App fill:#e6f3ff,stroke:#0066cc,stroke-width:2px
    style JSON_Payload fill:#ffe6cc,stroke:#ff9900,stroke-width:2px
```
