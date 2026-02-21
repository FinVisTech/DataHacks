import React, { useState } from 'react';
import SummaryTab from './tabs/SummaryTab';
import DecompositionTab from './tabs/DecompositionTab';
import CompareTab from './tabs/CompareTab';

export default function RightPanel({
    results,
    billText,
    audience,
    topK,
    tau
}) {
    const [activeTab, setActiveTab] = useState('summary');

    if (!results) {
        return (
            <div className="panel right-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ margin: '0 auto 1rem auto' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Awaiting legislation input.<br />Click "Run Simulation" to generate estimates.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="panel right-panel animate-fade">
            <div className="tabs-header">
                <button
                    className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Summary
                </button>
                <button
                    className={`tab-btn ${activeTab === 'decomposition' ? 'active' : ''}`}
                    onClick={() => setActiveTab('decomposition')}
                >
                    Decomposition
                </button>
                <button
                    className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
                    onClick={() => setActiveTab('compare')}
                >
                    What-if Compare
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'summary' && <SummaryTab results={results} audience={audience} />}
                {activeTab === 'decomposition' && <DecompositionTab results={results} billText={billText} />}
                {activeTab === 'compare' && (
                    <CompareTab
                        billText={billText}
                        audience={audience}
                        topK={topK}
                        tau={tau}
                        baseResults={results}
                    />
                )}
            </div>
        </div>
    );
}
