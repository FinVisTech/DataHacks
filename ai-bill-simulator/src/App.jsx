import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import InputPage from './pages/InputPage';
import ResultsPage from './pages/ResultsPage';
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
      <header className="home-header">
        <img
          src="https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg"
          alt="US Flag"
          style={{ height: '30px', marginLeft: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}
        />
        {/* Hidden nav for development purposes, but keep it mostly invisible or remove it. 
            The user can navigate via Run Simulation button */}
        {results && (
          <nav className="top-nav" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', marginRight: '1rem' }}>
            <NavLink to="/results" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Results Dashboard
            </NavLink>
          </nav>
        )}
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
