# AI Civic Alignment System — Full Project Design (Stanford + OECD)

## Project Purpose

This project builds a civic-tech analytics system that helps citizens and policymakers understand each other on AI legislation.

The system evaluates whether:

- citizens’ concerns  
- local policymaker preferences  
- real government policy activity  

are moving in the same direction.

The platform combines:

- Stanford AI Index data (sentiment + societal context + policy activity)
- OECD.AI policy corpus (policy text + metadata + implementation)
- Machine learning (classification, clustering, anomaly detection, forecasting)

The goal is transparency, not prediction accuracy.

---

## Core Question

Are AI policies aligned with stakeholder priorities, and where are the gaps?

Sub-questions:

- What policies do local officials believe are beneficial?
- What do citizens worry about or support?
- What policy action is actually happening?
- Which domains are lagging or accelerating?

---

## Data Architecture

The system uses three data layers.

---

### 1. Sentiment Layer — Stanford AI Index Public Opinion

This provides stakeholder attitudes.

#### Policymaker sentiment
- Local U.S. officials’ views on 15 AI policies
- Used to compute support_score and consensus_score
- Acts as the labeled seed dataset for support estimation

#### Citizen sentiment
- Public trust and concern surveys
- Job impact perception
- Demographic differences
- Sentiment trend over time

Purpose:
- Measure stakeholder perception
- Detect disagreement
- Anchor alignment scoring

---

### 2. Policy Activity & Societal Context — Stanford AI Index

These sections explain why alignment gaps occur.

#### Policy & Governance
- Number of AI bills
- AI mentions in legislation
- Regulatory activity by agency
- State-level policy counts
- Domain-specific laws (e.g., deepfakes)

Purpose:
- Measure real government action
- Compute regulation intensity
- Track momentum

---

#### Education
- CS access by state
- Workforce readiness
- Talent pipeline
- Representation indicators

Purpose:
- Digital equity scoring
- Implementation readiness
- Explain workforce-related policy support

---

#### Economy
- AI hiring penetration
- Skill penetration
- Talent concentration
- Organizational AI adoption
- Productivity expectations

Purpose:
- Measure economic pressure
- Explain policy urgency
- Provide forecasting signals

---

#### Responsible AI (optional but valuable)
- AI incident counts
- Risk perception
- Implementation barriers

Purpose:
- Risk pressure scoring
- Policy feasibility context

---

### 3. Policy Corpus — OECD.AI

This provides scale and structure.

Used fields:

- Policy title and description
- Category/domain
- Policy instrument (regulation, strategy, funding, etc.)
- Stakeholders affected
- Jurisdiction
- Timeline
- Implementation status

Purpose:
- Expand beyond 15 policies
- Enable similarity search
- Train domain classification
- Compute policy density
- Support cross-country alignment

OECD is not used as sentiment labels.

---

## System Pipeline

### Step 1 — Policy Parsing

Input:
- OECD policies
- Stanford policy examples
- User-uploaded policy text

Process:
- Extract domain
- Identify policy type
- Identify stakeholders
- Compute text features
- Create embeddings

Output:
- Structured policy feature vector

---

### Step 2 — Policymaker Support Estimation

Training data:
- Stanford local official policy dataset

Models:
- Random Forest (primary)
- Logistic regression baseline

Features:
- Policy text features
- Domain
- Stakeholders
- Education readiness context
- Economic pressure context
- Policy density context

Outputs:
- Support bucket
- Probability
- Feature importance

Purpose:
Decision-support for new policies.

---

### Step 3 — Alignment Engine (Core)

This integrates all layers.

For each domain or policy:

Compute:

- Citizen sentiment index
- Policymaker support index
- Regulation intensity index
- Policy density index
- Readiness index
- Economic pressure index

Then derive:

- Citizen–Policymaker Gap
- Policymaker–Action Gap
- Citizen–Action Gap
- Domain Alignment Score
- Policy Lag Score

ML components:
- Clustering of domains
- Disagreement prediction
- Gap anomaly detection
- Similarity-based explanation

Outputs:
- Alignment dashboard
- Gap detection
- Domain insights

---

### Step 4 — Regulation Momentum Forecast

Uses time-series signals from:

- Stanford policy activity
- Sentiment trends
- OECD policy growth
- Hiring/adoption pressure
- Education readiness
- Risk signals

Models:
- Regression
- Domain momentum scoring
- Scenario simulation

Outputs:
- Regulation momentum index
- Priority domains
- Early warning signals

---

### Step 5 — Policy Translator (Civic Interface)

When a policy is uploaded:

The system provides:

- Plain-language summary
- Domain classification
- Stakeholder impact
- Estimated policymaker support
- Similar OECD policies
- Alignment implications

Purpose:
Lower barrier to civic participation.

---

## Machine Learning Design

ML is used across multiple tasks:

- Classification (support estimation)
- Clustering (policy archetypes)
- Similarity search (policy comparison)
- Anomaly detection (alignment gaps)
- Regression (momentum)
- Scenario simulation

The project avoids heavy supervised learning due to limited labels.

---

## Evaluation Strategy

Evaluation focuses on:

- Interpretability
- Alignment metric stability
- Scenario plausibility
- Cross-dataset consistency
- Case study validation

Not accuracy alone.

---

## What Makes This Project Stronger

The pivot transforms the project from:

Small policy classifier → Civic intelligence platform

Strengths:

- Integrates sentiment, action, and context
- Uses real policy corpus
- Explains gaps rather than only predicting
- Supports both citizens and policymakers
- Demonstrates multiple ML paradigms
- Scales beyond the original 15 policies

---

## Expected Outputs

The system should produce:

- Alignment dashboards
- Domain gap maps
- Regulation momentum forecasts
- Policy similarity insights
- Scenario simulations
- Plain-language policy explanations

---

## Guiding Principle

The system’s role is to make AI policy relationships visible.

Success is defined by whether users can understand:

- what stakeholders want  
- what governments are doing  
- where they diverge  
- what might happen next  

The project is an explainable civic decision-support system built from Stanford AI Index data and OECD policy data.