# Recommended Workflow: AI Civic Alignment System

This document outlines the sequential step-by-step workflow required to run the AI Civic Alignment System, from downloading initial policy datasets to generating civic momentum analytics and predictions. 

---

## 🔑 Setup Note: API Key Management

The project uses a `.env` file to securely store your Hugging Face API key. This key is used for zero-shot domain classification in Step 1 and Step 5.

1. Create a file named `.env` in the root directory (one has been created for you).
2. Add your token to it:
   ```text
   HF_TOKEN="your_hf_access_token_here"
   ```

The system will automatically load this token when you run the scripts.

---

## Step 1: Policy Parsing Engine
Extracts information from Stanford's limited 15 labeled surveys and fetches the large-scale OECD Policy Initiatives corpus.

```bash
python src/step1_policy_parsing.py
```
- **Inputs**: `data/PUBLIC DATA_ 2025 AI Index Report/...`, `oecd_data.py` scraping connection.
- **Processing**: Domain NLP classification, Stakeholder extraction, Feature tagging.
- **Outputs**: `data/step1_parsed_policies.csv`

---

## Step 2: Policymaker Support Estimation
Uses the small official Stanford labels to train a Random Forest classifier. This acts as a decision-support module that generates support predictions across the entire massive, unlabeled OECD dataset.

```bash
python src/step2_support_estimation.py
```
- **Inputs**: `data/step1_parsed_policies.csv`
- **Processing**: Target binning (High/Medium/Low), Random Forest cross-validation, feature normalization.
- **Outputs**: `models/step2_support_estimator.pkl`, `data/step2_estimated_policies.csv`

---

## Step 3: Citizen-Policymaker-Government Alignment Engine
The core dashboard of the Civic Alignment system. It discovers the gaps between public sentiment, estimated official support, and actual regulatory intensity.

```bash
python src/step3_alignment_engine.py
```
- **Inputs**: `data/step2_estimated_policies.csv`
- **Processing**: Index normalization, IsolationForest anomaly detection, K-Means archetype clustering.
- **Outputs**: `data/step3_domain_alignment.csv`, alongside a rich Terminal Dashboard visualization highlighting the "Severe Disconnects."

---

## Step 4: Regulation Momentum Forecast
Uses year-over-year growth signals from the OECD combined with sentiment and structural pressure to determine which domains will undergo sudden regulatory priority shifts.

```bash
python src/step4_momentum_forecast.py
```
- **Inputs**: `data/step2_estimated_policies.csv`, `data/step3_domain_alignment.csv`
- **Processing**: Linear regression on OECD histories, weighted Momentum Index calculation.
- **Outputs**: `data/step4_momentum_forecast.csv` and a Terminal Dashboard displaying early shock warnings.

---

## Step 5: Policy Translator (Civic Interface)
A user-facing interface meant to lower the barrier for civic participation. It translates raw text into an easily understandable gap analysis using similarity search models trained on the OECD.

```bash
python src/step5_policy_translator.py "Your Custom Policy Text Here"
```
- **Inputs**: CLI String
- **Processing**: NLP extraction, Support Estimator loading, TF-IDF Cosine Similarity against the OECD database.
- **Outputs**: Instant terminal read-out of Domain Context, Disconnect insights, and Global Precedents.

---

## Conclusion
Following these 5 steps in order guarantees that your data flows organically from raw CSV scraping into a unified, actionable gap analysis system.
