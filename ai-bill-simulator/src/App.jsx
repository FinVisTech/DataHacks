import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import InputPage from './pages/InputPage';
import ResultsPage from './pages/ResultsPage';
import GlobePage from './pages/GlobePage';
import { simulate } from './utils/simulator';

function AppContent() {
  const [billText, setBillText] = useState('');
  const [audience, setAudience] = useState('Overall (National)');
  const [topK, setTopK] = useState(5);
  const [tau, setTau] = useState(1.0);

  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const handleRunSimulation = () => {
    if (!billText.trim()) {
      alert("Please paste a bill text or choose an example.");
      return;
    }
    const res = simulate(billText, audience, topK, tau);
    setResults(res);
    // Navigate to results page after simulation
    navigate('/results');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title-wrapper">
          <h1>AI Bill Sentiment Simulator</h1>
          <span className="header-subtitle">Estimate public support for proposed AI legislation by decomposing it into policy components.</span>
        </div>

        <nav className="top-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Editor
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Dashboard
          </NavLink>
          <NavLink to="/globe" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Globe
          </NavLink>
        </nav>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Export as PDF
          </button>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <InputPage
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
          } />
          <Route path="/results" element={
            <ResultsPage
              results={results}
              billText={billText}
              audience={audience}
              topK={topK}
              tau={tau}
            />
          } />
          <Route path="/globe" element={<GlobePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
