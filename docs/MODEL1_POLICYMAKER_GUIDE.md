# Model 1: Policymaker's Guide - Predicting Public Approval

## 🎯 The Core Question

**"I'm drafting a new AI policy. Will the public support it?"**

Model 1 answers this by learning from **16 historical AI policies** and their **actual public approval ratings**.

---

## 📥 WHAT YOU INPUT (As a Policymaker)

### **Single Input: Policy Text**
Just the policy name or description, for example:

```
"Mandatory AI transparency requirements for healthcare algorithms"
```

**That's it!** The model extracts everything else automatically.

---

## 🔧 WHAT HAPPENS BEHIND THE SCENES

### **Step 1: Feature Extraction** (Automatic)

The model analyzes your policy text and extracts **14 features**:

#### **A. Policy Domain** (What category is this?)
- Privacy, Employment, Economic, Legal/Governance, Technology, Social
- **How**: Keyword matching (e.g., "privacy" → Privacy domain)

#### **B. Policy Characteristics** (Binary flags)
- `is_privacy`: Contains "privacy" or "data"?
- `is_employment`: Contains "hiring", "unemployed", "retraining"?
- `is_economic`: Contains "tax", "subsidy", "antitrust"?
- `is_legal`: Contains "regulation", "ban", "sentencing"?
- `is_tech`: Contains "ai", "hardware", "semiconductor"?
- `is_social`: Contains "safety net", "basic income"?
- `has_ban`: Contains the word "ban"?
- `has_regulation`: Contains "regulation"?
- `word_count`: How many words in the policy name?

#### **C. Estimated Support Metrics** (From similar policies)
- `neutral_pct`: Estimated % who will be neutral (from similar policies)
- `disagree_pct`: Estimated % who will disagree (from similar policies)
- `support_score`: Estimated net support (agree - disagree)
- `consensus_score`: Estimated non-opposition (agree + neutral)

**Example**: For "Stricter data privacy regulations":
- Domain: Privacy
- `is_privacy = 1`, `is_legal = 1`, `has_regulation = 1`
- Similar policies (Privacy domain) had average: neutral_pct=9.5%, disagree_pct=10.1%
- Estimated support_score = 80.4% - 10.1% = 70.3%

---

## 🧠 HOW THE MODEL LEARNED

### **Training Data: 16 Historical Policies**

The model was trained on these policies with **known public approval**:

| Policy | Agree % | Support Level |
|--------|---------|---------------|
| Stricter data privacy regulations | 80.4% | **High** |
| Retraining for unemployed | 76.2% | **High** |
| AI deployment regulations | 72.5% | **High** |
| Stronger antitrust | 57.7% | **Medium** |
| Parole and sentencing AI regulations | 54.7% | **Medium** |
| Bias audits for hiring and promotion AI | 51.7% | **Medium** |
| Robot tax | 42.4% | **Medium** |
| Universal basic income | 24.6% | **Low** |
| ... | ... | ... |

### **What Patterns It Learned**:

1. **Privacy policies** → High support (70-80%)
   - Pattern: `is_privacy=1` + `has_regulation=1` → High support

2. **Employment policies** → Medium-High support (51-76%)
   - Pattern: `is_employment=1` → Medium-High support

3. **Policies with "ban"** → Lower support (34-42%)
   - Pattern: `has_ban=1` → Lower support

4. **Support score** → Strongest predictor
   - Pattern: Higher `support_score` → Higher support level

---

## 📤 WHAT YOU GET AS OUTPUT

### **Output 1: Predicted Support Level**
```
"High" | "Medium" | "Low"
```

**Meaning**:
- **High**: Expected public approval >60% (based on historical patterns)
- **Medium**: Expected public approval 40-60%
- **Low**: Expected public approval <40%

### **Output 2: Confidence Scores**
```
High: 78% confidence
Medium: 18% confidence  
Low: 4% confidence
```

**Meaning**: The model is **78% confident** this will have High support.

### **Output 3: Key Factors** (What drives the prediction)
```
Top predictors:
1. Policy domain (Privacy) → Increases support
2. Has "regulation" keyword → Increases support
3. Estimated support score → Strong predictor
```

---

## 💼 REAL EXAMPLE FOR POLICYMAKERS

### **Scenario**: You're drafting a new bill

**Your Input**:
```
"Federal requirements for AI bias audits in financial services"
```

**Model Processing**:

1. **Extracts Features**:
   - Domain: Legal/Governance (contains "requirements", "audits")
   - `is_legal = 1` (contains "audits")
   - `is_economic = 1` (contains "financial")
   - `has_regulation = 0` (no "regulation" keyword)
   - Word count: 8

2. **Finds Similar Policies**:
   - "Bias audits for hiring and promotion AI" → 51.7% support (Medium)
   - "AI deployment regulations" → 72.5% support (High)
   - Legal/governance policies → Medium-High support

3. **Makes Prediction**:
   - **Predicted**: "Medium" support
   - **Confidence**: 65% Medium, 25% High, 10% Low
   - **Expected Approval**: ~50-55%

**Output to You**:
```
✅ Predicted Support: MEDIUM (65% confidence)
📊 Expected Public Approval: ~50-55%

💡 Key Insights:
- Similar policies (bias audits) received 51.7% support
- Legal/governance policies tend to have medium-high support
- Consider adding "regulation" keyword to potentially increase support
```

**Your Action**:
- Proceed with drafting (moderate public support expected)
- Consider emphasizing privacy/transparency aspects
- Monitor public sentiment during drafting phase

---

## 🎯 HOW THIS EMPOWERS YOU

### **1. Pre-Drafting: Should I prioritize this?**
- Input: Policy concept
- Output: Predicted support level
- **Action**: Focus resources on High/Medium support policies

### **2. Drafting: How can I increase support?**
- Input: Policy draft
- Output: Feature importance shows what drives support
- **Action**: Emphasize high-impact characteristics (e.g., privacy framing)

### **3. Refinement: Will this wording help?**
- Input: Policy variations
- Output: Compare predicted support levels
- **Action**: Choose wording that maximizes predicted support

### **4. Strategic Planning: What should we prioritize?**
- Input: Multiple policy proposals
- Output: Ranked by predicted support
- **Action**: Focus legislative resources on high-support policies

---

## 📊 THE LEARNING PROCESS

### **How the Model Analyzes**:

1. **Random Forest Algorithm**: Creates 100 "decision trees"
   - Each tree learns different patterns
   - Example Tree 1: "If Privacy domain AND has_regulation → High support"
   - Example Tree 2: "If support_score > 50 → High support"
   - Example Tree 3: "If has_ban → Lower support"

2. **Voting System**: 
   - Each tree votes: High, Medium, or Low
   - Final prediction = majority vote
   - Confidence = % of trees that agree

3. **Pattern Recognition**:
   - Learns: Privacy + Regulation → High support
   - Learns: Ban keyword → Lower support
   - Learns: Support score is strongest predictor

---

## 🔍 KEY INSIGHTS FROM THE MODEL

### **What Drives Public Support**:

1. **Privacy is Popular** (70-80% support)
   - Frame policies in privacy terms when possible

2. **Employment Policies Resonate** (51-76% support)
   - Emphasize employment/economic benefits

3. **"Ban" is Controversial** (34-42% support)
   - Use "regulation" instead of "ban" when possible

4. **Domain Matters**: Policy category is a strong predictor
   - Privacy > Employment > Economic > Social

5. **Support Score is Key**: Net support (Agree - Disagree) is strongest predictor
   - Focus on policies that minimize opposition

---

## ✅ SUMMARY FOR YOUR PRESENTATION

**Input**: Policy text (new legislation proposal)

**Processing**: 
- Extracts 14 features automatically
- Compares to 16 historical policies
- Uses Random Forest (100 decision trees) to predict

**Output**: 
- Predicted support level (High/Medium/Low)
- Confidence scores
- Key factors driving the prediction

**Value**: 
- Predict public approval **before** drafting
- Optimize policy wording to maximize support
- Prioritize policies with high predicted support
- Understand what characteristics drive approval

**Impact**: 
"Empowers policymakers to gauge public approval of future AI legislation based on previous legislation and public sentiment."

---

## 🚀 Next Steps

1. **Test the Model**: Input your policy proposals
2. **Compare Variations**: Test different wordings
3. **Use Insights**: Focus on high-support characteristics
4. **Validate**: Compare predictions to actual public sentiment (when available)
