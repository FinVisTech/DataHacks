import React, { useState, useMemo } from 'react';
import { simulate } from '../../utils/simulator';

const TOGGLES = [
    { id: 'enforcement', label: 'Increase enforcement strictness (+Privacy/Deploy)', keywords: 'privacy data safety testing deployment' },
    { id: 'retraining', label: 'Add retraining funding (+Retraining)', keywords: 'retraining workforce' },
    { id: 'audit', label: 'Add audit requirement (+Bias Audits)', keywords: 'audit bias fairness' },
    { id: 'facialRec', label: 'Add facial recognition ban', keywords: 'facial recognition police' },
    { id: 'robotTax', label: 'Add robot tax', keywords: 'robot tax automation tax' }
];

export default function CompareTab({ billText, audience, topK, tau, baseResults }) {
    const [activeToggles, setActiveToggles] = useState({});

    const handleToggle = (id) => {
        setActiveToggles(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const modifiedResults = useMemo(() => {
        let modifiedText = billText;
        TOGGLES.forEach(t => {
            if (activeToggles[t.id]) {
                modifiedText += ' ' + t.keywords;
            }
        });

        return simulate(modifiedText, audience, topK, tau);
    }, [billText, audience, topK, tau, activeToggles]);

    const baseDist = baseResults.predictedDistribution;
    const modDist = modifiedResults.predictedDistribution;

    const deltaAgree = (modDist.Agree - baseDist.Agree) * 100;
    const deltaDisagree = (modDist.Disagree - baseDist.Disagree) * 100;

    return (
        <div className="tab-pane animate-fade compare-grid">
            {/* Left Column: Baseline */}
            <div className="card">
                <h3>Baseline (Current Bill)</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    Net Support: {((baseDist.Agree - baseDist.Disagree) * 100).toFixed(1)} pts
                </p>

                <div className="stacked-bar-container" style={{ margin: '1rem 0' }}>
                    <div className="stacked-bar" style={{ height: '24px' }}>
                        <div className="stacked-segment bg-agree" style={{ width: `${baseDist.Agree * 100}%` }}></div>
                        <div className="stacked-segment bg-neutral" style={{ width: `${baseDist.Neutral * 100}%` }}></div>
                        <div className="stacked-segment bg-disagree" style={{ width: `${baseDist.Disagree * 100}%` }}></div>
                    </div>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div>Agree: {(baseDist.Agree * 100).toFixed(1)}%</div>
                    <div>Disagree: {(baseDist.Disagree * 100).toFixed(1)}%</div>
                </div>
            </div>

            {/* Right Column: Modified */}
            <div className="compare-builder">
                <h3>Scenario Builder</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Toggle policy insertions to simulate opinion shifts.</p>

                <div className="stacked-bar-container" style={{ margin: '1rem 0' }}>
                    <div className="stacked-bar" style={{ height: '24px', opacity: Object.values(activeToggles).some(v => v) ? 1 : 0.6 }}>
                        <div className="stacked-segment bg-agree" style={{ width: `${modDist.Agree * 100}%` }}></div>
                        <div className="stacked-segment bg-neutral" style={{ width: `${modDist.Neutral * 100}%` }}></div>
                        <div className="stacked-segment bg-disagree" style={{ width: `${modDist.Disagree * 100}%` }}></div>
                    </div>
                </div>

                <div className="builder-delta">
                    <div className={`delta-item ${deltaAgree > 0 ? 'pos' : ''}`}>
                        Agree: {(modDist.Agree * 100).toFixed(1)}% ({deltaAgree > 0 ? '+' : ''}{deltaAgree.toFixed(1)})
                    </div>
                    <div className={`delta-item ${deltaDisagree < 0 ? 'pos' : 'neg'}`}>
                        Disagree: {(modDist.Disagree * 100).toFixed(1)}% ({deltaDisagree > 0 ? '+' : ''}{deltaDisagree.toFixed(1)})
                    </div>
                </div>

                <div className="builder-toggles">
                    {TOGGLES.map(t => (
                        <label key={t.id} className="builder-toggle-item toggle-switch">
                            <span>{t.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={!!activeToggles[t.id]}
                                    onChange={() => handleToggle(t.id)}
                                />
                                <span className="toggle-slider"></span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
