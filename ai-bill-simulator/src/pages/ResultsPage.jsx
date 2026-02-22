import React from 'react';
import { useNavigate } from 'react-router-dom';
import RightPanel from '../components/RightPanel';

export default function ResultsPage({
    results, billText, audience, topK, tau
}) {
    const navigate = useNavigate();

    return (
        <div className="page-container page-results animate-fade">
            <div className="results-header-actions">
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                    &larr; Back to Editor
                </button>
            </div>
            <RightPanel
                results={results}
                billText={billText}
                audience={audience}
                topK={topK}
                tau={tau}
            />
        </div>
    );
}
