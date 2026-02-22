import React, { useRef, useState } from 'react';
import './Home.css';
import { exampleBills } from '../utils/examples';

export default function LeftPanel({
    billText,
    setBillText,
    audience,
    setAudience,
    topK,
    setTopK,
    tau,
    setTau,
    onRun
}) {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('Upload File');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (evt) => {
                setBillText(evt.target.result);
            };
            reader.readAsText(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleRunAnalysis = () => {
        // Fallback to example bill if completely empty for simulation purposes
        if (!billText.trim()) {
            setBillText(exampleBills[0].text);
            // We need a short delay so state updates before running, 
            // but for simplicity let's just run it with the example bill text directly
            // inside simulate instead of relying on state batching
        }
        onRun();
    };

    return (
        <div className="home-container">
            <div className="home-bg-columns">
                <div className="column-left"></div>
                <div className="column-right"></div>
            </div>

            <div className="home-content">
                <h1 className="home-title">Enter Your Bill</h1>

                <div className="home-form">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label className="home-label">Audience:</label>
                        <select
                            className="home-input"
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                        >
                            <option>National (All)</option>
                            <option>Democrats</option>
                            <option>Republicans</option>
                            <option>18–29</option>
                            <option>30–49</option>
                            <option>50+</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label className="home-label">File:</label>
                        <button
                            className="home-input"
                            style={{ textAlign: 'left', color: fileName === 'Upload File' ? '#333' : '#5b80b2' }}
                            onClick={handleUploadClick}
                        >
                            {fileName}
                        </button>
                        <input
                            type="file"
                            accept=".txt,.md,.pdf"
                            ref={fileInputRef}
                            className="home-file-input"
                            onChange={handleFileChange}
                        />
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                            (If no file is provided, an example policy will be used)
                        </div>
                    </div>

                    <button className="home-button" onClick={handleRunAnalysis}>
                        Run Analysis
                    </button>
                </div>
            </div>
        </div>
    );
}
