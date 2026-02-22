# AI Civic Alignment System

This project is a **Civic Intelligence Platform** built to analyze the alignment between citizen public opinion, policymaker preferences, and actual government policy action. By combining small labeled sentiment data from the Stanford AI Index with the large-scale policy corpora of OECD.AI, the system provides transparent decision-support tools for civic participation without overclaiming predictive accuracy.

## Core Mission
To enhance government transparency and civic participation through rigorous policy analysis, making the relationships between citizens, policymakers, and real policy action legible.

**Key Question:** *Do policymakers, citizens, and governments move in the same direction on AI policy — and where are the gaps?*

## Project Architecture

The system avoids heavy supervised pipelines in favor of an interpretable, scalable architecture broken down into 5 modular steps:

### 1. Policy Parsing (`step1_policy_parsing.py`)
Fetches and merges data from Stanford AI surveys and the OECD.AI database. Uses Hugging Face Zero-Shot NLP to extract policy domains, stakeholders, and text features into a unified corpus.

### 2. Policymaker Support Estimation (`step2_support_estimation.py`)
Uses the official local Stanford AI support data to train an interpretable Random Forest classifier. This serves as a decision-support module that estimates support buckets for the entire vast, unlabeled OECD policy corpus.

### 3. Civic Alignment Engine (Core) (`step3_alignment_engine.py`)
The centerpiece of the system. Computes critical civic discrepancies such as the **Citizen-Policymaker Gap** and the **Policy Lag Score**. Identifies severe disconnects through Anomaly Detection (Isolation Forest) and archetype clustering (K-Means).

### 4. Regulation Momentum Forecast (`step4_momentum_forecast.py`)
Uses multi-year policy growth rates blended with sentiment indicators and economic pressure context to forecast which domains will experience impending regulatory momentum or priority spikes.

### 5. Policy Translator / Civic Interface (`step5_policy_translator.py`)
A fast, simple CLI interface meant to lower the barrier for civic participation. Users can input a hypothetical or new AI policy, and the system immediately generates:
- Plain language classification
- Expected local policymaker reception
- Similar global historical precedents (via NLP similarity)
- Contextual warnings regarding the policy domain

---

## Installation

```bash
# Clone the repository and enter the directory
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> **Note on NLP Classification:** The system defaults to using the free Hugging Face Inference API for accurate domain clustering. To ensure best performance, set your HF key in your environment before running via: `export HF_TOKEN="your_token"`

## Quick Start

Run the entire pipeline sequentially:

```bash
python src/step1_policy_parsing.py
python src/step2_support_estimation.py
python src/step3_alignment_engine.py
python src/step4_momentum_forecast.py
```

Finally, try out the Civic Policy Translator with your own custom text:
```bash
python src/step5_policy_translator.py "Subsidies for university AI researchers focusing on healthcare applications"
```

Please see `WORKFLOW.md` for more detailed execution steps and expected inputs/outputs of each individual module.
