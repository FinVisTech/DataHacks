# Domain Classification: Keyword vs NLP (Local vs Hosted API)

## Overview

The data processor supports **three** modes for classifying policy **domains**:

| Mode       | CLI flag              | Domain classification     | Binary flags   | Extra deps   |
|-----------|------------------------|---------------------------|----------------|--------------|
| **keyword** | `--classification keyword` (default) | Keyword matching          | Keyword        | None         |
| **nlp**     | `--classification nlp`              | Local transformers model  | Keyword        | transformers, torch |
| **nlp-api** | `--classification nlp-api`          | **Hugging Face hosted API** | Keyword     | requests, HF token  |

**Binary flags** (e.g. `is_privacy`, `has_ban`) are always derived from **keyword matching** so processing stays fast and simple. Only the **domain** label uses NLP when you choose `nlp` or `nlp-api`.

---

## Usage

### 1. Keyword (default)

```bash
python data_processor.py
# or
python data_processor.py --classification keyword
```

- No extra dependencies.
- Domain and binary flags from keyword rules.

### 2. Local NLP (transformers)

```bash
python data_processor.py --classification nlp
```

- Uses `facebook/bart-large-mnli` via the `transformers` library.
- First run downloads the model (~1.6GB).
- Domain from zero-shot NLP; binary flags still from keywords.

**Install:** `pip install transformers torch`

### 3. Hosted API (Hugging Face Inference API)

```bash
# With token in environment (recommended)
export HF_TOKEN=your_token_here
python data_processor.py --classification nlp-api

# Or pass token on command line
python data_processor.py --classification nlp-api --hf-token YOUR_TOKEN
```

- **No local model download.** Calls Hugging Face’s hosted Inference API.
- Same BART model as local NLP, run on their servers.
- Needs a Hugging Face account and API token.
- Domain from API; binary flags still from keywords.

**Token:** [Create at Hugging Face](https://huggingface.co/settings/tokens).  
**Env vars:** `HF_TOKEN` or `HUGGING_FACE_HUB_TOKEN` (either works).

---

## Using the Hugging Face Hosted API

### Why use the API?

- No GPU or large disk needed.
- No `transformers` / `torch` install.
- Same zero-shot model as local (`facebook/bart-large-mnli`).
- Free tier available (rate limits apply).

### Get an API token

1. Sign up: [huggingface.co/join](https://huggingface.co/join).
2. Create a token: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
3. Use “Read” or “Inference” scope.

### Set the token

```bash
# Linux / macOS
export HF_TOKEN=hf_xxxxxxxxxxxx

# Or
export HUGGING_FACE_HUB_TOKEN=hf_xxxxxxxxxxxx
```

Or pass it once per run:

```bash
python data_processor.py --classification nlp-api --hf-token hf_xxxxxxxxxxxx
```

### Rate limits (free tier)

- The free Inference API has rate limits.
- For 15 policies you typically stay within limits.
- If you hit limits, the code falls back to keyword classification for that call and continues.

---

## How the hosted API is used

- **Endpoint:** `https://api-inference.huggingface.co/models/facebook/bart-large-mnli`
- **Task:** Zero-shot classification (NLI-based).
- **Input:** Policy text + list of domain labels.
- **Output:** Predicted domain (highest-scoring label).
- **Library:** `requests` (no `transformers` needed for `nlp-api`).

The same candidate labels and domain mapping are used as in local NLP, so results are comparable.

---

## Binary flags (all modes)

Binary flags are **not** from NLP; they stay keyword-based in every mode:

- `is_privacy`, `is_employment`, `is_economic`, `is_legal`, `is_tech`, `is_social`
- `has_ban`, `has_regulation`
- `word_count`

So:

- **Domain:** keyword **or** NLP (local or API), depending on `--classification`.
- **Binaries:** always keyword.

Using the API only for domain keeps the number of API calls low (one per policy) and avoids extra latency/cost for the simple binary rules.

---

## Summary

- **Argument:** `--classification keyword | nlp | nlp-api` (and optional `--hf-token` for `nlp-api`).
- **Keyword:** default; no API, no extra deps.
- **NLP local:** `--classification nlp`; needs `transformers` + `torch`.
- **NLP hosted:** `--classification nlp-api`; uses Hugging Face Inference API and a token; no local model; binary flags still from keywords.
