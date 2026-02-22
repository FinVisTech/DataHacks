import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

// Real State AI Legislation Data (2023 - 2026)
const LEGISLATION_DATA = {
    "Alabama": { proposed: 11, passed: 3 },
    "Alaska": { proposed: 12, passed: 1 },
    "Arizona": { proposed: 13, passed: 4 },
    "Arkansas": { proposed: 15, passed: 5 },
    "California": { proposed: 109, passed: 8 },
    "Colorado": { proposed: 16, passed: 6 },
    "Connecticut": { proposed: 29, passed: 3 },
    "Delaware": { proposed: 6, passed: 3 },
    "Florida": { proposed: 40, passed: 9 },
    "Georgia": { proposed: 40, passed: 15 },
    "Hawaii": { proposed: 61, passed: 6 },
    "Idaho": { proposed: 9, passed: 1 },
    "Illinois": { proposed: 88, passed: 7 },
    "Indiana": { proposed: 13, passed: 7 },
    "Iowa": { proposed: 21, passed: 2 },
    "Kansas": { proposed: 7, passed: 3 },
    "Kentucky": { proposed: 16, passed: 2 },
    "Louisiana": { proposed: 16, passed: 9 },
    "Maine": { proposed: 26, passed: 2 },
    "Maryland": { proposed: 72, passed: 18 },
    "Massachusetts": { proposed: 81, passed: 2 },
    "Michigan": { proposed: 17, passed: 3 },
    "Minnesota": { proposed: 38, passed: 2 },
    "Mississippi": { proposed: 20, passed: 3 },
    "Missouri": { proposed: 19, passed: 2 },
    "Montana": { proposed: 34, passed: 11 },
    "Nebraska": { proposed: 13, passed: 4 },
    "Nevada": { proposed: 24, passed: 4 },
    "New Hampshire": { proposed: 8, passed: 2 },
    "New Jersey": { proposed: 112, passed: 7 },
    "New Mexico": { proposed: 20, passed: 5 },
    "New York": { proposed: 235, passed: 6 },
    "North Carolina": { proposed: 42, passed: 4 },
    "North Dakota": { proposed: 15, passed: 12 },
    "Ohio": { proposed: 10, passed: 1 },
    "Oklahoma": { proposed: 29, passed: 2 },
    "Oregon": { proposed: 20, passed: 6 },
    "Pennsylvania": { proposed: 47, passed: 1 },
    "Rhode Island": { proposed: 38, passed: 7 },
    "South Carolina": { proposed: 17, passed: 7 },
    "South Dakota": { proposed: 3, passed: 2 },
    "Tennessee": { proposed: 40, passed: 5 },
    "Texas": { proposed: 89, passed: 25 },
    "Utah": { proposed: 22, passed: 17 },
    "Vermont": { proposed: 13, passed: 0 },
    "Virginia": { proposed: 54, passed: 11 },
    "Washington": { proposed: 36, passed: 3 },
    "West Virginia": { proposed: 20, passed: 6 },
    "Wisconsin": { proposed: 16, passed: 1 },
    "Wyoming": { proposed: 7, passed: 1 }
};

const getBaseStateData = (stateName) => {
    return LEGISLATION_DATA[stateName] || { proposed: 0, passed: 0 };
};

const interpolateHeatmapColor = (ratio) => {
    const safeRatio = Math.max(0, Math.min(1, ratio));
    const r = Math.round(255 * (1 - safeRatio));
    const g = 0;
    const b = Math.round(255 * safeRatio);
    return `rgb(${r}, ${g}, ${b})`;
};

// Removed MOCK_ML_DATA; now using dynamic backend results.

const USStatesLayer = ({ onHoverState }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !window.google) return;

        const dataLayer = new window.google.maps.Data({ map });
        dataLayer.loadGeoJson('/us-states.json');

        dataLayer.setStyle((feature) => {
            const stateName = feature.getProperty('name');
            const data = getBaseStateData(stateName);

            const MAX_ENACTED = 25;
            const ratio = data.passed / MAX_ENACTED;
            let fillColor = interpolateHeatmapColor(ratio);

            return {
                fillColor: fillColor,
                fillOpacity: data.proposed > 0 ? 0.7 : 0.3,
                strokeWeight: 1,
                strokeColor: '#555',
            };
        });

        const mouseoverListener = dataLayer.addListener('mouseover', (event) => {
            dataLayer.revertStyle();
            dataLayer.overrideStyle(event.feature, {
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: '#fff'
            });
            const stateName = event.feature.getProperty('name');
            onHoverState(stateName);
        });

        const mouseoutListener = dataLayer.addListener('mouseout', (event) => {
            dataLayer.revertStyle();
            onHoverState(null);
        });

        return () => {
            window.google.maps.event.removeListener(mouseoverListener);
            window.google.maps.event.removeListener(mouseoutListener);
            dataLayer.setMap(null);
        };
    }, [map, onHoverState]);

    return null;
};

USStatesLayer.propTypes = {
    onHoverState: PropTypes.func.isRequired,
};

const COUNTRY_COORDS = {
    "United States of America": { lat: 39.8283, lng: -98.5795, zoom: 4 },
    "China": { lat: 35.8617, lng: 104.1954, zoom: 4 },
    "France": { lat: 46.2276, lng: 2.2137, zoom: 5 },
    "United Kingdom": { lat: 55.3781, lng: -3.4360, zoom: 5 },
    "Serbia": { lat: 44.0165, lng: 21.0059, zoom: 6 }
};

const CountriesLayer = ({ onHoverCountry, targetCountry, devOutlines }) => {
    const map = useMap();
    const dataLayerRef = useRef(null);
    const listenersRef = useRef([]);

    // Auto-pan to target country
    useEffect(() => {
        if (!map) return;
        const coords = COUNTRY_COORDS[targetCountry] || { lat: 20, lng: 0, zoom: 2 };
        map.panTo({ lat: coords.lat, lng: coords.lng });
        map.setZoom(coords.zoom);
    }, [map, targetCountry]);

    useEffect(() => {
        if (!map || !window.google) return;

        if (!dataLayerRef.current) {
            dataLayerRef.current = new window.google.maps.Data({ map });
            dataLayerRef.current.loadGeoJson('/countries.json');
        } else {
            dataLayerRef.current.setMap(map);
        }

        const dataLayer = dataLayerRef.current;

        // Clean up old listeners to prevent duplicates on dependency change
        listenersRef.current.forEach(listener => {
            window.google.maps.event.removeListener(listener);
        });
        listenersRef.current = [];

        const DEMO_COUNTRIES = [
            "United States of America", "France", "China", "United Kingdom",
            "Argentina", "Armenia", "Australia", "Austria", "Belgium",
            "Belgium - Brussels Capital", "Brazil", "Bulgaria", "Canada", "Chile",
            "Colombia", "Costa Rica", "Croatia", "Cyprus", "Czech Republic",
            "Denmark", "Egypt", "Estonia", "European Union", "Finland", "Germany",
            "Greece", "Hungary", "Iceland", "India", "Indonesia", "Ireland",
            "Israel", "Italy", "Japan", "Kazakhstan", "Kenya", "South Korea",
            "Latvia", "Lithuania", "Luxembourg", "Malta", "Mauritius", "Mexico",
            "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Peru",
            "Poland", "Portugal", "Romania", "Russia", "Rwanda", "Saudi Arabia",
            "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "Spain",
            "Sweden", "Switzerland", "Thailand", "Tunisia", "Turkey", "Uganda",
            "Ukraine", "United Arab Emirates", "Uruguay", "Uzbekistan", "Vietnam"
        ];

        dataLayer.setStyle((feature) => {
            const countryName = feature.getProperty('name');

            if (!DEMO_COUNTRIES.includes(countryName) && countryName !== targetCountry) {
                return { visible: false };
            }

            const isTarget = countryName === targetCountry;
            const isDevOutline = devOutlines && DEMO_COUNTRIES.includes(countryName);

            if (!isTarget && !isDevOutline) {
                return { visible: false };
            }

            return {
                fillColor: isTarget ? '#00FFFF' : '#333333',
                fillOpacity: isTarget ? 0.7 : (isDevOutline ? 0.2 : 0),
                strokeWeight: isTarget ? 3 : (isDevOutline ? 2 : 0),
                strokeColor: isTarget ? '#00FFFF' : (isDevOutline ? '#00FF00' : '#555'),
                visible: true
            };
        });

        const mouseoverListener = dataLayer.addListener('mouseover', (event) => {
            const countryName = event.feature.getProperty('name');
            dataLayer.revertStyle();

            dataLayer.overrideStyle(event.feature, {
                fillOpacity: 0.9,
                strokeWeight: 4,
                strokeColor: '#fff',
                fillColor: countryName === targetCountry ? '#E0FFFF' : '#555555'
            });
            onHoverCountry(countryName);
        });

        const mouseoutListener = dataLayer.addListener('mouseout', (event) => {
            dataLayer.revertStyle();
            onHoverCountry(null);
        });

        listenersRef.current.push(mouseoverListener, mouseoutListener);
    }, [map, onHoverCountry, targetCountry, devOutlines]);

    useEffect(() => {
        return () => {
            if (dataLayerRef.current) {
                dataLayerRef.current.setMap(null);
            }
            listenersRef.current.forEach(listener => {
                window.google.maps.event.removeListener(listener);
            });
        };
    }, []);

    return null;
};

CountriesLayer.propTypes = {
    onHoverCountry: PropTypes.func.isRequired,
    targetCountry: PropTypes.string.isRequired,
    devOutlines: PropTypes.bool.isRequired,
};

export default function GlobePage({ backendResults }) {
    const [viewMode, setViewMode] = useState('state'); // 'state' or 'country'
    const [hoveredState, setHoveredState] = useState(null);
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [devOutlines, setDevOutlines] = useState(false);

    // Derived values from backend API
    const targetCountry = backendResults ? backendResults.impacted_country : "United States of America";
    const nlSummary = backendResults ? backendResults.nl_summary : "No analysis data available. Please run an analysis on the Editor page first.";
    const hasData = !!backendResults;
    const est = backendResults?.data?.estimation;
    const ctx = backendResults?.data?.context;

    // Default to country view if we have backend results
    useEffect(() => {
        if (hasData) {
            setViewMode('country');
        }
    }, [hasData]);

    return (
        <div className="globe-page-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>

                {/* View Toggle */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    backgroundColor: 'rgba(20, 20, 25, 0.9)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #444',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '12px',
                    minWidth: '180px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ display: 'flex', background: '#222', borderRadius: '8px', overflow: 'hidden', border: '1px solid #444' }}>
                        <button
                            onClick={() => setViewMode('state')}
                            style={{
                                flex: 1,
                                background: viewMode === 'state' ? '#007FFF' : 'transparent',
                                color: viewMode === 'state' ? '#fff' : '#888',
                                border: 'none',
                                padding: '8px 12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            States
                        </button>
                        <button
                            onClick={() => setViewMode('country')}
                            style={{
                                flex: 1,
                                background: viewMode === 'country' ? '#007FFF' : 'transparent',
                                color: viewMode === 'country' ? '#fff' : '#888',
                                border: 'none',
                                padding: '8px 12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            Countries
                        </button>
                    </div>

                    {viewMode === 'country' && (
                        <button
                            onClick={() => setDevOutlines(prev => !prev)}
                            style={{
                                background: devOutlines ? '#228B22' : '#333',
                                border: '1px solid #555',
                                color: '#fff',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                outline: 'none',
                                fontSize: '0.85rem',
                                width: '100%',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            Dev Outlines: {devOutlines ? 'ON' : 'OFF'}
                        </button>
                    )}
                </div>

                {/* Info Overlay UI */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    backgroundColor: 'rgba(15, 15, 20, 0.85)',
                    backdropFilter: 'blur(12px)',
                    padding: '20px 25px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    zIndex: 10,
                    color: '#fff',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    minWidth: '300px',
                    maxWidth: '420px',
                    fontFamily: '"Inter", "Outfit", sans-serif'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', fontWeight: '600', letterSpacing: '0.5px' }}>
                        {viewMode === 'state' ? 'State Legislative Activity' : 'Global Policy Impact'}
                    </h3>

                    {viewMode === 'state' ? (
                        hoveredState ? (
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#007FFF', marginBottom: '8px' }}>
                                    {hoveredState}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: '#aaa' }}>Total Proposed AI Bills:</span>
                                    <span style={{ fontWeight: 'bold' }}>{getBaseStateData(hoveredState).proposed}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: '#aaa' }}>Number of AI Bills Enacted:</span>
                                    <span style={{ fontWeight: 'bold', color: getBaseStateData(hoveredState).passed > 0 ? '#32CD32' : 'inherit' }}>
                                        {getBaseStateData(hoveredState).passed}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #333' }}>
                                    <span style={{ color: '#aaa' }}>Enacted Level:</span>
                                    <span style={{ fontWeight: 'bold', color: interpolateHeatmapColor(getBaseStateData(hoveredState).passed / 25) }}>
                                        {getBaseStateData(hoveredState).passed > 15 ? 'Very High' : (getBaseStateData(hoveredState).passed > 5 ? 'Moderate' : (getBaseStateData(hoveredState).passed > 0 ? 'Low' : 'None'))}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#aaa', fontStyle: 'italic', padding: '10px 0' }}>
                                Hover over a state on the map to view recent AI bill data.
                            </div>
                        )
                    ) : (
                        (hasData || hoveredCountry) ? (
                            <div className="animate-fade-in">
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '12px' }}>
                                    {hoveredCountry || targetCountry}
                                </div>
                                {(hoveredCountry === targetCountry || (!hoveredCountry && hasData)) ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{ background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 127, 255, 0.15))', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.4)', boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)' }}>
                                            <div style={{ color: '#00FFFF', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 5px rgba(0, 255, 255, 0.5)' }}>
                                                Primary Impact Zone
                                            </div>
                                            <div style={{ color: '#e0e0e0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                                {/* Split the summary by word to apply a subtle gradient to the text */}
                                                <span style={{ background: '-webkit-linear-gradient(0deg, #fff, #87CEEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '500' }}>
                                                    {nlSummary}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Dynamic Metrics */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ flex: '1 1 45%', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #00FFFF' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Forecasted Support</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00FFFF' }}>{est?.support_level || 'N/A'}</div>
                                            </div>
                                            <div style={{ flex: '1 1 45%', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #32CD32' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>System Confidence</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#32CD32' }}>{est ? `${(est.confidence * 100).toFixed(1)}%` : 'N/A'}</div>
                                            </div>
                                            {ctx && (
                                                <>
                                                    <div style={{ flex: '1 1 45%', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #FF4500' }}>
                                                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Civic/Policy Gap</div>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FF4500' }}>{ctx.citizen_policymaker_gap.toFixed(1)}</div>
                                                    </div>
                                                    <div style={{ flex: '1 1 45%', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #9370DB' }}>
                                                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Domain Alignment</div>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#9370DB' }}>{ctx.domain_alignment_score.toFixed(1)}/100</div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#aaa', fontStyle: 'italic', padding: '10px 0', fontSize: '0.9rem' }}>
                                        No specific impact predicted for this region. Global metrics are optimized for primary impact zones.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: '#aaa', fontStyle: 'italic', padding: '20px 0', textAlign: 'center', fontSize: '0.95rem' }}>
                                Run an analysis to view predictive NLP and model insights.
                            </div>
                        )
                    )}
                </div>

                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
                    <Map
                        defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
                        defaultZoom={4}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        mapId="DEMO_MAP_ID"
                        style={{ width: '100%', height: '100%' }}
                    >
                        {viewMode === 'state' ? (
                            <USStatesLayer onHoverState={setHoveredState} />
                        ) : (
                            <CountriesLayer onHoverCountry={setHoveredCountry} targetCountry={targetCountry} devOutlines={devOutlines} />
                        )}
                    </Map>
                </APIProvider>
            </div>
        </div>
    );
}

GlobePage.propTypes = {
    backendResults: PropTypes.object
};
