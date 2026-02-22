import PropTypes from 'prop-types';
import LeftPanel from '../components/LeftPanel';

export default function InputPage({
    billFile, setBillFile,
    billText, setBillText,
    topK, setTopK,
    tau, setTau,
    onRun
}) {
    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <LeftPanel
                billFile={billFile}
                setBillFile={setBillFile}
                billText={billText}
                setBillText={setBillText}
                topK={topK}
                setTopK={setTopK}
                tau={tau}
                setTau={setTau}
                onRun={onRun}
            />
        </div>
    );
}

InputPage.propTypes = {
    billFile: PropTypes.object,
    setBillFile: PropTypes.func.isRequired,
    billText: PropTypes.string.isRequired,
    setBillText: PropTypes.func.isRequired,
    topK: PropTypes.number.isRequired,
    setTopK: PropTypes.func.isRequired,
    tau: PropTypes.number.isRequired,
    setTau: PropTypes.func.isRequired,
    onRun: PropTypes.func.isRequired,
};
