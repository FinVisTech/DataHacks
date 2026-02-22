import React from 'react';
import LeftPanel from '../components/LeftPanel';

export default function InputPage({
    billText, setBillText,
    audience, setAudience,
    topK, setTopK,
    tau, setTau,
    onRun
}) {
    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <LeftPanel
                billText={billText}
                setBillText={setBillText}
                audience={audience}
                setAudience={setAudience}
                topK={topK}
                setTopK={setTopK}
                tau={tau}
                setTau={setTau}
                onRun={onRun}
            />
        </div>
    );
}
