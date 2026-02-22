import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import InputPage from './pages/InputPage';
import ResultsPage from './pages/ResultsPage';
import GlobePage from './pages/GlobePage';
// Replaced local simulator with backend API
// import { simulate } from './utils/simulator';

function AppContent() {
  const [billFile, setBillFile] = useState(null);
  const [billText, setBillText] = useState('');
  const [topK, setTopK] = useState(5);
  const [tau, setTau] = useState(1.0);

  const [audience, setAudience] = useState('general');
  const [results, setResults] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const navigate = useNavigate();

  const handleRunSimulation = async () => {
    let currentFile = billFile;

    // Build the fallback file if we just have text but no file
    if (!currentFile && billText.trim()) {
      currentFile = new Blob([billText], { type: 'text/plain' });
      currentFile.name = 'uploaded_bill.txt';
    }

    if (!currentFile) {
      alert("Please upload a text file.");
      return;
    }

    setLoadingMsg('Initializing AI Parser Pipeline...');
    setLoadingProgress(10);

    // Animate progress up to 90
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev < 30) {
          setLoadingMsg('Extracting civic features and domain...');
          return prev + 5;
        } else if (prev < 60) {
          setLoadingMsg('Running support estimator ML model...');
          return prev + 5;
        } else if (prev < 90) {
          setLoadingMsg('Retrieving OECD Precedents...');
          return prev + 2;
        }
        return prev;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append('file', currentFile, currentFile.name || 'uploaded_bill.txt');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMsg('Analysis Complete!');

      setResults(data);

      // Delay slightly so user sees 100%
      setTimeout(() => {
        setLoadingMsg('');
        setLoadingProgress(0);
        navigate('/globe'); // Changed from /results to /globe for UX flow
      }, 800);

    } catch (err) {
      clearInterval(progressInterval);
      setLoadingMsg('');
      setLoadingProgress(0);
      alert("Failed to run analysis: " + err.message);
    }
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
          {/* Removed Results Dashboard as Globe is now the destination */}
          <NavLink to="/globe" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Globe
          </NavLink>
        </nav>
      </header>

      {/* Global Loading Overlay */}
      {loadingMsg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '2rem', color: '#007FFF' }}>
            {loadingMsg}
          </h2>
          <div style={{
            width: '60%', height: '12px', background: '#333',
            borderRadius: '6px', overflow: 'hidden', boxShadow: '0 0 15px rgba(0, 127, 255, 0.5)'
          }}>
            <div style={{
              height: '100%', width: `${loadingProgress}%`,
              background: 'linear-gradient(90deg, #007FFF, #00FFFF)',
              transition: 'width 0.4s ease',
              boxShadow: '0 0 10px #007FFF'
            }} />
          </div>
          <p style={{ marginTop: '10px', fontSize: '1.2rem', color: '#ccc' }}>
            {Math.round(loadingProgress)}%
          </p>
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <InputPage
              billFile={billFile}
              setBillFile={setBillFile}
              billText={billText}
              setBillText={setBillText}
              topK={topK}
              setTopK={setTopK}
              tau={tau}
              setTau={setTau}
              onRun={loadingMsg ? () => { } : handleRunSimulation}
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
          <Route path="/globe" element={<GlobePage backendResults={results} />} />
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
