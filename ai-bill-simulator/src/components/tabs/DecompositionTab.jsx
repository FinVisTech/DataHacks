import React, { useMemo } from 'react';

export default function DecompositionTab({ results, billText }) {
    const { categoryContributions, isFallback } = results;

    // Simple text highlighter: wraps matched keywords in <mark> tags
    const highlightedTextMarkup = useMemo(() => {
        if (!billText) return '';
        let htmlText = billText;

        // Gather all unique keywords across top categories
        const allKeywords = new Set();
        categoryContributions.forEach(cat => {
            cat.matchedKeywords.forEach(kw => allKeywords.add(kw));
        });

        if (allKeywords.size > 0) {
            // Sort length descending to avoid partial matches overriding longer ones
            const sortedKeywords = Array.from(allKeywords).sort((a, b) => b.length - a.length);
            sortedKeywords.forEach(kw => {
                const regex = new RegExp(`(\\b${kw}\\b)`, 'gi');
                htmlText = htmlText.replace(regex, '<mark>$1</mark>');
            });
        }

        return { __html: htmlText };
    }, [billText, categoryContributions]);

    return (
        <div className="tab-pane animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h3>Policy Decomposition Highlights</h3>
                {isFallback ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                        No explicit keywords found; inferred by semantic proximity (stub).
                    </p>
                ) : (
                    <div
                        style={{
                            padding: '1rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.875rem',
                            lineHeight: '1.6',
                            maxHeight: '150px',
                            overflowY: 'auto'
                        }}
                        dangerouslySetInnerHTML={highlightedTextMarkup}
                    />
                )}
            </div>

            <div>
                <h3>Component Weights (w_i) & Contributions</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Ranked categories that drive the predicted distribution.
                </p>

                <div className="decomposition-list">
                    {categoryContributions.map((cat, idx) => {
                        const { Agree, Neutral, Disagree } = cat.contributions;
                        return (
                            <div key={idx} className="card decomposition-card">
                                <div className="decomp-header">
                                    <div className="decomp-title" title="Why? Keywords matched in text">
                                        {cat.name}
                                    </div>
                                    <div className="decomp-weight">
                                        {(cat.weight * 100).toFixed(1)}%
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="decomp-chips">
                                        <span className="chip agree">+{(Agree * 100).toFixed(1)}% Agree</span>
                                        <span className="chip neutral">+{(Neutral * 100).toFixed(1)}% Neutral</span>
                                        <span className="chip disagree">+{(Disagree * 100).toFixed(1)}% Disagree</span>
                                    </div>

                                    {cat.matchedKeywords.length > 0 && (
                                        <div className="keyword-list">
                                            {cat.matchedKeywords.map((kw, i) => (
                                                <span key={i} className="keyword-badge">"{kw}"</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
