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
    const handleExampleClick = (text) => {
        setBillText(text);
    };

    return (
        <div className="panel left-panel">
            <div className="input-group">
                <label className="input-label">Paste proposed bill text</label>
                <textarea
                    className="form-control"
                    placeholder="Enter the raw text of the legislation here..."
                    value={billText}
                    onChange={(e) => setBillText(e.target.value)}
                />
                <div className="char-count">
                    {billText.length} characters
                </div>
            </div>

            <div className="input-group">
                <label className="input-label">Quick Examples</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {exampleBills.map((ex, i) => (
                        <button
                            key={i}
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleExampleClick(ex.text)}
                        >
                            Ex {i + 1}: {ex.title.split(':')[0]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label">Audience</label>
                <select
                    className="form-control"
                    style={{ padding: '0.5rem' }}
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                >
                    <option>Overall (National)</option>
                    <option>Democrats</option>
                    <option>Republicans</option>
                    <option>18–29</option>
                    <option>30–49</option>
                    <option>50+</option>
                </select>
            </div>

            <div className="input-group">
                <label className="input-label">Top-K Categories</label>
                <div className="slider-container">
                    <input
                        type="range"
                        min="3"
                        max="15"
                        value={topK}
                        onChange={(e) => setTopK(parseInt(e.target.value))}
                    />
                    <span className="slider-value">{topK}</span>
                </div>
            </div>

            <div className="input-group">
                <label className="input-label">Temperature (τ) - Softmax smoothing</label>
                <div className="slider-container">
                    <input
                        type="range"
                        min="0.3"
                        max="2.0"
                        step="0.1"
                        value={tau}
                        onChange={(e) => setTau(parseFloat(e.target.value))}
                    />
                    <span className="slider-value">{tau.toFixed(1)}</span>
                </div>
            </div>

            <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
                <span>Segment by paragraph (UI Only)</span>
            </label>

            <button className="btn btn-primary" onClick={onRun} style={{ marginTop: '1rem', padding: '1rem' }}>
                Run Simulation
            </button>
        </div>
    );
}
