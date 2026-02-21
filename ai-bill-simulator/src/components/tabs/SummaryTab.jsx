import React from 'react';

export default function SummaryTab({ results, audience }) {
    const { Agree, Neutral, Disagree } = results.predictedDistribution;

    const pctAgree = (Agree * 100).toFixed(1);
    const pctNeutral = (Neutral * 100).toFixed(1);
    const pctDisagree = (Disagree * 100).toFixed(1);

    const netSupport = (Agree - Disagree) * 100;

    return (
        <div className="tab-pane animate-fade">
            <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Predicted Approval Distribution</h2>
                <p>Audience Segment: <strong>{audience}</strong></p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-agree)' }}>{pctAgree}%</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Agree</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-neutral)' }}>{pctNeutral}%</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Neutral</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-disagree)' }}>{pctDisagree}%</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Disagree</div>
                    </div>
                </div>

                <div className="stacked-bar-container">
                    <div className="stacked-bar">
                        <div className="stacked-segment bg-agree" style={{ width: `${pctAgree}%` }}>{pctAgree >= 5 ? `${pctAgree}%` : ''}</div>
                        <div className="stacked-segment bg-neutral" style={{ width: `${pctNeutral}%` }}>{pctNeutral >= 5 ? `${pctNeutral}%` : ''}</div>
                        <div className="stacked-segment bg-disagree" style={{ width: `${pctDisagree}%` }}>{pctDisagree >= 5 ? `${pctDisagree}%` : ''}</div>
                    </div>
                    <div className="bar-legend">
                        <div className="legend-item"><span className="legend-dot bg-agree"></span> Agree</div>
                        <div className="legend-item"><span className="legend-dot bg-neutral"></span> Neutral</div>
                        <div className="legend-item"><span className="legend-dot bg-disagree"></span> Disagree</div>
                    </div>
                </div>

                <div className={`net-support-badge ${netSupport >= 0 ? 'positive' : 'negative'}`}>
                    Net Support: {netSupport > 0 ? '+' : ''}{netSupport.toFixed(1)} pts
                </div>
            </div>

            <div className="card">
                <h3>Confidence Estimation</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: results.isFallback ? 'var(--color-neutral)' : 'var(--color-agree)'
                    }}></span>
                    <strong>{results.isFallback ? 'Low (Inferred Content)' : 'Medium-High'}</strong>
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    Prototype estimate; confidence derived from category concentration and keyword density match.
                </p>
            </div>
        </div>
    );
}
