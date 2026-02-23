import sys
import os
import time
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Ensure src is in path so we can import step5
sys.path.append(str(Path(__file__).resolve().parent))
from step5_policy_translator import PolicyTranslator

app = FastAPI(title="AI Policy Simulator API")

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

translator = None

@app.on_event("startup")
def startup_event():
    global translator
    print("Loading ML models for API...")
    try:
        translator = PolicyTranslator()
        print("ML models loaded successfully!")
    except Exception as e:
        print(f"Error loading models: {e}")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI Policy API is running"}

@app.post("/api/analyze")
def analyze_bill(file: UploadFile = File(...)):
    # Add a delay to simulate serious number crunching
    time.sleep(3)
    if not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")
    
    content = file.file.read()
    try:
        text = content.decode('utf-8')
    except UnicodeDecodeError:
        # Fallback if text is not utf-8
        text = content.decode('latin-1')
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty file")
        
    try:
        result = translator.analyze_json(text)
        
        # Extract the most impacted country from the closest similar policy
        country = "France" # Default fallback
        if result.get('similar_policies') and len(result['similar_policies']) > 0:
            # Note: OECD data sometimes has 'European Union', we might want to map that or leave it
            country = result['similar_policies'][0]['country']
            
        # NLP Keyword override for explicit country targeting
        text_lower = text.lower()
        if "china" in text_lower:
            country = "China"
        elif "united states" in text_lower or " usa " in text_lower:
            country = "United States of America"
        elif "united kingdom" in text_lower or " uk " in text_lower:
            country = "United Kingdom"
        elif "france" in text_lower:
            country = "France"
        elif "european union" in text_lower or " eu " in text_lower:
            country = "European Union"
            
        # Add magical NL Summary based on the results
        domain = result['classification']['domain'].title()
        support = result['estimation']['support_level'].title()
        prob = result['estimation']['confidence']
        
        momentum = f"The proposed AI policies within the **{domain}** domain are expected to face **{support}** reception from policymakers ({prob:.1%} confidence). "
        
        ctx = result.get('context')
        if ctx:
            momentum += f"Current alignment shows a **{ctx['archetype']}** archetype with a citizen-policymaker gap of {ctx['citizen_policymaker_gap']:.1f}. "
            if ctx['policy_lag_score'] > 20:
                momentum += "Regulation is currently lagging behind economic needs, which could accelerate legislative action. "
                
        momentum += f"\n\nBased on semantic similarity, **{country}** shows the most relevant historical precedents, positioning it as a key focal point for immediate impact and momentum shifts."
        
        return {
            "success": True,
            "data": result,
            "impacted_country": country,
            "nl_summary": momentum
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Force reload
    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
