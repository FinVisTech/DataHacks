# Domain Classification and Binary Flags: How It Works

## Overview

The feature engineering process extracts **domain classification** and **binary flags** from policy text using simple keyword matching. This document explains exactly how it works.

---

## Domain Classification

### Method: Sequential Keyword Matching with Priority Order

The `_classify_policy_domain()` function uses an **if/elif chain** that checks keywords in order of priority. **First match wins**.

### Classification Rules (in priority order):

#### 1. **Privacy Domain**
- **Keywords**: `'privacy'`, `'data'`
- **Example**: "Stricter data privacy regulations" → `Privacy`
- **Logic**: Checks if policy text contains "privacy" OR "data"

#### 2. **Employment Domain**
- **Keywords**: `'hiring'`, `'unemployed'`, `'retraining'`, `'wage'`, `'bias'`
- **Example**: "Bias audits for hiring and promotion AI" → `Employment`
- **Logic**: Checks if policy text contains ANY of these keywords
- **Note**: "bias" is included because bias audits are typically employment-related

#### 3. **Economic Domain**
- **Keywords**: `'tax'`, `'subsidy'`, `'antitrust'`, `'income'`
- **Example**: "Robot tax" → `Economic`
- **Example**: "Semiconductor and AI hardware subsidies" → `Economic` (matches "subsidy")
- **Logic**: Checks if policy text contains ANY of these keywords

#### 4. **Legal/Governance Domain**
- **Keywords**: `'regulation'`, `'ban'`, `'sentencing'`, `'parole'`, `'facial'`
- **Example**: "Law enforcement facial recognition ban" → `Legal/Governance`
- **Example**: "AI deployment regulations" → `Legal/Governance`
- **Logic**: Checks if policy text contains ANY of these keywords

#### 5. **Technology Domain**
- **Keywords**: `'ai'`, `'hardware'`, `'semiconductor'`
- **Example**: "Semiconductor and AI hardware subsidies" → `Technology` (if Economic didn't match first)
- **Logic**: Checks if policy text contains ANY of these keywords

#### 6. **Social Domain**
- **Keywords**: `'safety net'`, `'basic income'`
- **Example**: "Universal basic income" → `Social`
- **Logic**: Checks if policy text contains these exact phrases

#### 7. **Other**
- **Default**: If no keywords match → `'Other'`

### Important: Priority Matters!

Because the classification uses an **if/elif chain**, the order matters:

**Example**: "Bias audits for hiring and promotion AI"
- Contains: `'bias'` (Employment), `'hiring'` (Employment), `'regulation'` (Legal), `'ai'` (Technology)
- **Result**: `Employment` (because Employment is checked BEFORE Legal/Governance)

**Example**: "Semiconductor and AI hardware subsidies"
- Contains: `'subsidy'` (Economic), `'semiconductor'` (Technology), `'hardware'` (Technology), `'ai'` (Technology)
- **Result**: `Economic` (because Economic is checked BEFORE Technology)

---

## Binary Flags

### Method: Simple Keyword Presence Check

Each binary flag checks if specific keywords exist in the policy text (case-insensitive). **Multiple flags can be 1 for the same policy**.

### Flag Definitions:

#### 1. **is_privacy**
- **Check**: `'privacy'` OR `'data'` in policy text
- **Example**: "Stricter data privacy regulations" → `is_privacy = 1`
- **Example**: "AI deployment regulations" → `is_privacy = 0`

#### 2. **is_employment**
- **Check**: ANY of `['hiring', 'unemployed', 'retraining', 'wage']` in policy text
- **Example**: "Retraining for unemployed" → `is_employment = 1`
- **Example**: "Robot tax" → `is_employment = 0`
- **Note**: Does NOT include "bias" (that's only for domain classification)

#### 3. **is_economic**
- **Check**: ANY of `['tax', 'subsidy', 'antitrust', 'income']` in policy text
- **Example**: "Robot tax" → `is_economic = 1`
- **Example**: "Higher corporate income taxes" → `is_economic = 1` (matches "tax" and "income")

#### 4. **is_legal**
- **Check**: ANY of `['regulation', 'ban', 'sentencing', 'parole']` in policy text
- **Example**: "AI deployment regulations" → `is_legal = 1`
- **Example**: "Law enforcement facial recognition ban" → `is_legal = 1` (matches "ban")

#### 5. **is_tech**
- **Check**: ANY of `['ai', 'hardware', 'semiconductor', 'facial']` in policy text
- **Example**: "Semiconductor and AI hardware subsidies" → `is_tech = 1` (matches all three!)
- **Example**: "Law enforcement facial recognition ban" → `is_tech = 1` (matches "facial")

#### 6. **is_social**
- **Check**: ANY of `['safety net', 'basic income']` in policy text
- **Example**: "Universal basic income" → `is_social = 1`
- **Example**: "Stronger social safety net" → `is_social = 1`

#### 7. **has_ban**
- **Check**: `'ban'` in policy text
- **Example**: "Law enforcement facial recognition ban" → `has_ban = 1`
- **Example**: "AI deployment regulations" → `has_ban = 0`

#### 8. **has_regulation**
- **Check**: `'regulation'` in policy text
- **Example**: "AI deployment regulations" → `has_regulation = 1`
- **Example**: "Robot tax" → `has_regulation = 0`

#### 9. **word_count**
- **Check**: Number of words in policy name (split by spaces)
- **Example**: "Stricter data privacy regulations" → `word_count = 4`
- **Example**: "Robot tax" → `word_count = 2`

---

## Examples

### Example 1: "Bias audits for hiring and promotion AI"
- **Domain**: `Employment` (matches "hiring" first)
- **Flags**:
  - `is_employment = 1` (has "hiring")
  - `is_legal = 0` (no "regulation", "ban", "sentencing", "parole")
  - `is_tech = 1` (has "ai")
  - `has_regulation = 0` (no "regulation" keyword)
  - `word_count = 6`

### Example 2: "Stricter data privacy regulations"
- **Domain**: `Privacy` (matches "privacy" first)
- **Flags**:
  - `is_privacy = 1` (has "privacy")
  - `is_legal = 1` (has "regulation")
  - `has_regulation = 1` (has "regulation")
  - `word_count = 4`

### Example 3: "Law enforcement facial recognition ban"
- **Domain**: `Legal/Governance` (matches "ban" first, but "facial" is also checked)
- **Flags**:
  - `is_legal = 1` (has "ban")
  - `is_tech = 1` (has "facial")
  - `has_ban = 1` (has "ban")
  - `word_count = 4`

### Example 4: "Semiconductor and AI hardware subsidies"
- **Domain**: `Economic` (matches "subsidy" first, even though it has tech keywords)
- **Flags**:
  - `is_economic = 1` (has "subsidy")
  - `is_tech = 1` (has "ai", "hardware", "semiconductor")
  - `word_count = 5`

---

## Code Location

- **Domain Classification**: `data_processor.py` → `PolicyDataProcessor._classify_policy_domain()`
- **Binary Flags**: `data_processor.py` → `PolicyDataProcessor.create_policy_features()`

---

## Limitations & Future Improvements

### Current Limitations:
1. **Simple keyword matching**: No NLP, no context understanding
2. **Priority-based**: First match wins (may not always be ideal)
3. **No multi-domain**: Policies can only have ONE domain (even if they span multiple)
4. **Case-insensitive but exact match**: "data" matches but "database" also matches

### Potential Improvements:
1. **Use NLP**: Named entity recognition, topic modeling
2. **Multi-label classification**: Allow policies to belong to multiple domains
3. **Fuzzy matching**: Handle typos, synonyms
4. **Context-aware**: Consider word order, phrases vs. individual words
5. **Machine learning**: Train a classifier on labeled examples

---

## Summary

- **Domain**: One category per policy (Privacy, Employment, Economic, Legal/Governance, Technology, Social, Other)
- **Binary Flags**: Multiple can be 1 (is_privacy, is_employment, etc.)
- **Method**: Simple keyword matching (case-insensitive)
- **Priority**: Domain classification uses if/elif chain (first match wins)
- **Flexibility**: Binary flags are independent (multiple can be true)
