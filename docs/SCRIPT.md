# AI Civic Alignment - Project Overview Script

**[Demonstrate the website/dashboard]**

This is our application, the AI Civic Alignment System. It serves as a decision-support engine that analyzes AI legislation and evaluates whether those policies truly align with public appetite and economic realities. Rather than just tracking what laws are passed, it helps guide policy creation by identifying gaps between citizen sentiment, institutional support, and actual legislative action.

For this project, we built a comprehensive dataset using two primary sources: the Stanford Institute for Human-Centered Artificial Intelligence (HAI) 2025 AI Index Reports and the OECD AI Policy Observatory. These sources provided us with a global corpus of nearly 2,000 AI-related policies, alongside real-world country-level data on public AI sentiment, AI job market pressures, and computer science education readiness.

To make sense of this massive dataset, we built a multi-stage machine learning pipeline. First, we used an NLP-based model to parse and classify every enacted AI policy into core domains like Privacy, Economy, and Legal Governance. We then cleaned, standardized, and normalized the Stanford country-level contextual data so we could make fair, data-driven comparisons across different nations.

At the core of our engine, we trained a Random Forest classification model—validated through Leave-One-Out Cross-Validation (LOOCV)—specifically to estimate *policymaker and institutional support* for new AI bills. By contrasting this generated institutional support score against the baseline public sentiment data from Stanford, our system can calculate "Alignment Gaps." 

As a result, our system groups policy domains into alignment archetypes—highlighting, for instance, when regulation is severely lagging behind economic pressure or when there is a massive disconnect between what the public wants and what lawmakers are passing. 

Our goal with this project is to increase transparency and rigor in AI policymaking. By allowing lawmakers or citizens to translate proposed bills through our engine, we can provide an honest, data-backed momentum indicator to help understand how those bills fit into the broader global and domestic alignment landscape.
