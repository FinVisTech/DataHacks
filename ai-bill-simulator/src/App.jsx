import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import InputPage from './pages/InputPage';
import ResultsPage from './pages/ResultsPage';
import GlobePage from './pages/GlobePage';
import { simulate } from './utils/simulator';

function AppContent() {
  const [billText, setBillText] = useState('');
  const [topK, setTopK] = useState(5);
  const [tau, setTau] = useState(1.0);

  const [audience, setAudience] = useState('general');
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const handleRunSimulation = () => {
    if (!billText.trim()) {
      alert("Please paste a bill text or choose an example.");
      return;
    }
    const res = simulate(billText, topK, tau);
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
          className="flag-icon"
          onClick={() => navigate('/globe')}
        />
        <button
          onClick={() => navigate('/')}
          style={{
            marginLeft: '15px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.borderColor = 'rgba(255,255,255,0.8)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
        >
          Home
        </button>

        <h1 className="header-main-title">AI Policy Sentiment Analysis</h1>

        <nav className="top-nav" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', marginRight: '1rem', display: 'flex', gap: '1rem' }}>
          <NavLink to="/" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Editor
          </NavLink>
          {results && (
            <NavLink to="/results" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Results Dashboard
            </NavLink>
          )}
          <NavLink to="/globe" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Globe
          </NavLink>
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <InputPage
              billText={billText}
              setBillText={setBillText}
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
