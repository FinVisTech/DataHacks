# Quick Start Guide

## ⚠️ Important: Which Script Does What?

### `test_backend.py` - **ONLY TESTS DATA LOADING**
- ✅ Verifies CSV files can be loaded
- ✅ Checks dependencies are installed
- ❌ **Does NOT train any models**
- **Use this first** to make sure everything is set up

### Modular Scripts - **TRAINS MODELS**
The project is split into four distinct scripts that should be run in sequence:
1. `data_processor.py` (Loads all data, Creates features)
2. `model_support_classifier.py` (Trains Model 1: Support Classifier)
3. `model_alignment_scorer.py` (Calculates Alignment Scores)
4. `model_regulation_predictor.py` (Trains Model 3: Regulation Predictor)

---

## 🚀 Step-by-Step

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Test Data Loading (Optional but recommended)
```bash
python test_backend.py
```

### Step 3: Train All Models (Sequentially)

**1. Process Data**
```bash
python data_processor.py -l
```
Creates: `outputs/processed_policies.csv`

**2. Train Model 1**
```bash
python model_support_classifier.py
```
Creates: `models/policy_support_model.pkl`

**3. Calculate Alignment Scores**
```bash
python model_alignment_scorer.py
```
Creates: `outputs/policy_alignment_scores.csv`

**4. Train Model 3**
```bash
python model_regulation_predictor.py
```
Creates: `models/regulation_predictor_model.pkl`

---

## 📁 After Training

You'll have:
- `models/policy_support_model.pkl` - Trained Model 1
- `models/regulation_predictor_model.pkl` - Trained Model 3
- `outputs/policy_alignment_scores.csv` - Alignment scores
- `outputs/processed_policies.csv` - Cleaned data
- `outputs/regulation_predictions.csv` - Predictions and features

---

## 🔍 Verify It Worked

Check that files were created:
```bash
ls models/
ls outputs/
```

You should see:
- `models/policy_support_model.pkl`
- `models/regulation_predictor_model.pkl`
- `outputs/policy_alignment_scores.csv`
- `outputs/processed_policies.csv`
- `outputs/regulation_predictions.csv`

---

## ❓ Troubleshooting

**Error: "File not found"**
- Make sure you're in the project root directory
- Check that `data/PUBLIC DATA_ 2025 AI Index Report/` exists

**Error: "Module not found"**
- Run: `pip install -r requirements.txt`

**Error: "Permission denied"**
- Make sure `models/` and `outputs/` directories exist (they're created automatically)
