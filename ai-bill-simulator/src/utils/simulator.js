import categoriesData from './categories.json';

const KEYWORDS = {
  "Data Privacy Regulation": ["privacy", "data", "consent", "deletion", "opt-out"],
  "Bias Audits (Hiring/Promotion)": ["audit", "bias", "fairness", "discrimination", "hiring", "promotion"],
  "AI Deployment Regulation": ["safety testing", "licensing", "standards", "deployment", "compliance"],
  "Employment Retraining": ["retraining", "reskill", "unemployment", "workforce"],
  "Antitrust": ["monopoly", "competition", "breakup"],
  "Criminal Justice AI": ["parole", "sentencing", "courts", "probation"],
  "Social Safety Net": ["welfare", "benefits", "social safety net"],
  "Federal Oversight (Gov AI)": ["federal oversight", "local government", "agencies"],
  "Hardware Subsidies (Chips/AI)": ["chips", "semiconductors", "hardware", "subsidies"],
  "Higher Corporate Income Taxes": ["corporate tax", "tax rate"],
  "Robot Tax": ["robot tax", "automation tax"],
  "Immigration Reform (AI Talent)": ["visas", "immigration", "talent", "h-1b"],
  "Facial Recognition Ban (Law Enforcement)": ["facial recognition", "law enforcement", "police"],
  "Wage Subsidies (Wage Declines)": ["wage insurance", "wage subsidy"],
  "Universal Basic Income (UBI)": ["ubi", "universal basic income"]
};

export function simulate(billText, topK = 5, tau = 1.0) {
  const textLower = billText.toLowerCase();

  let rawScores = {};
  let totalMatches = 0;

  const matchedPhrases = {};

  Object.entries(KEYWORDS).forEach(([cat, words]) => {
    rawScores[cat] = 0;
    matchedPhrases[cat] = [];
    words.forEach(w => {
      // simple match count
      const regex = new RegExp(`\\b${w}\\b`, 'g');
      const matches = textLower.match(regex);
      if (matches) {
        rawScores[cat] += matches.length;
        totalMatches += matches.length;
        if (!matchedPhrases[cat].includes(w)) {
          matchedPhrases[cat].push(w);
        }
      }
    });
  });

  // Default to moderate mix if no matches
  if (totalMatches === 0) {
    rawScores["Data Privacy Regulation"] = 1;
    rawScores["AI Deployment Regulation"] = 1;
    rawScores["Federal Oversight (Gov AI)"] = 1;
  }

  // Sort and keep topK
  const sorted = Object.entries(rawScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK);

  // If no scores > 0 even after fallback (shouldn't happen), safeguard
  if (sorted.length === 0) {
    sorted.push(["Data Privacy Regulation", 1]);
  }

  // Softmax with temperature tau
  let maxScore = sorted[0][1];
  let expSum = 0;
  const expScores = sorted.map(([cat, score]) => {
    const val = Math.exp((score - maxScore) / tau);
    expSum += val;
    return { cat, val };
  });

  let weights = {};
  Object.keys(categoriesData).forEach(cat => weights[cat] = 0);

  expScores.forEach(({ cat, val }) => {
    weights[cat] = val / expSum;
  });

  // Calculate predicted distribution
  let predAgree = 0;
  let predNeutral = 0;
  let predDisagree = 0;

  const categoryContributions = [];

  Object.entries(weights).forEach(([cat, w]) => {
    if (w > 0) {
      const baseDist = categoriesData[cat];

      const cAgree = w * baseDist.Agree;
      const cNeutral = w * baseDist.Neutral;
      const cDisagree = w * baseDist.Disagree;

      predAgree += cAgree;
      predNeutral += cNeutral;
      predDisagree += cDisagree;

      categoryContributions.push({
        name: cat,
        weight: w,
        contributions: {
          Agree: cAgree,
          Neutral: cNeutral,
          Disagree: cDisagree
        },
        matchedKeywords: matchedPhrases[cat] || []
      });
    }
  });

  // Sort descending by weight
  categoryContributions.sort((a, b) => b.weight - a.weight);

  return {
    weights,
    predictedDistribution: {
      Agree: predAgree,
      Neutral: predNeutral,
      Disagree: predDisagree
    },
    categoryContributions,
    isFallback: totalMatches === 0
  };
}
