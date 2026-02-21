import React, { useState } from 'react';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import { simulate } from './utils/simulator';

export default function App() {
  const [billText, setBillText] = useState('');
  const [audience, setAudience] = useState('Overall (National)');
  const [topK, setTopK] = useState(5);
  const [tau, setTau] = useState(1.0);

  const [results, setResults] = useState(null);

  const handleRunSimulation = () => {
    if (!billText.trim()) {
      alert("Please paste a bill text or choose an example.");
      return;
    }
    const res = simulate(billText, audience, topK, tau);
    setResults(res);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title-wrapper">
          <h1>AI Bill Sentiment Simulator</h1>
          <span className="header-subtitle">Estimate public support for proposed AI legislation by decomposing it into policy components.</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Export as PDF
          </button>
        </div>
      </header>

      <main className="main-content">
        <LeftPanel
          billText={billText}
          setBillText={setBillText}
          audience={audience}
          setAudience={setAudience}
          topK={topK}
          setTopK={setTopK}
          tau={tau}
          setTau={setTau}
          onRun={handleRunSimulation}
        />

        <RightPanel
          results={results}
          billText={billText}
          audience={audience}
          topK={topK}
          tau={tau}
        />
      </main>
    </div>
  );
}
