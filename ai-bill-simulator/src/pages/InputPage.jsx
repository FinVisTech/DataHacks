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
        <div className="page-container page-input animate-fade">
            <div className="input-page-centered">
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
        </div>
    );
}
