import React, { useRef, useState } from 'react';
import './Home.css';
import { exampleBills } from '../utils/examples';
import uploadIcon from '../assets/upload.svg';

export default function LeftPanel({
    billFile,
    setBillFile,
    billText,
    setBillText,
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
            setBillFile(file);
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
        if (!billText.trim() && !billFile) {
            setBillText(exampleBills[0].text);
            const blob = new Blob([exampleBills[0].text], { type: 'text/plain' });
            blob.name = 'example.txt';
            setBillFile(blob);
            // Wait slightly for state updater
            setTimeout(() => onRun(), 100);
        } else {
            onRun();
        }
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
                        <label className="home-label">File:</label>
                        <button
                            className="home-input"
                            style={{ color: fileName === 'Upload File' ? '#333' : '#5b80b2' }}
                            onClick={handleUploadClick}
                        >
                            <img
                                src={uploadIcon}
                                alt="Upload Icon"
                                style={{ width: '48px', height: '48px', opacity: fileName === 'Upload File' ? 0.7 : 1 }}
                            />
                            <span>{fileName}</span>
                        </button>
                        <input
                            type="file"
                            accept=".txt,.md,.pdf"
                            ref={fileInputRef}
                            className="home-file-input"
                            onChange={handleFileChange}
                        />
                    </div>

                    <button className="home-button" onClick={handleRunAnalysis}>
                        Run Analysis
                    </button>
                </div>
            </div>
        </div>
    );
}
