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

const MOCK_ML_DATA = {
    country: "France",
    momentumForecast: "The proposed AI policies are expected to significantly accelerate France's tech sector momentum over the next 3-5 years. With streamlined regulations around AI R&D and clear guidelines on ethical deployments, startups and enterprise hubs such as Station F will see an influx of venture capital. The focus on establishing local sovereign models reduces overseas dependency, catalyzing domestic hardware expansion and compute clusters. We anticipate a 35% growth in AI-centric jobs and higher adoption rates among legacy industries like aviation and healthcare. The momentum is firmly positive, positioning France as a leading AI hub within the European Union."
};

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

const CountriesLayer = ({ onHoverCountry, targetCountry, devOutlines }) => {
    const map = useMap();
    const dataLayerRef = useRef(null);
    const listenersRef = useRef([]);

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
                fillColor: isTarget ? '#9400D3' : '#333333',
                fillOpacity: isTarget ? 0.6 : (isDevOutline ? 0.2 : 0),
                strokeWeight: isTarget ? 1 : (isDevOutline ? 2 : 0),
                strokeColor: isDevOutline ? '#00FF00' : '#555',
                visible: true
            };
        });

        const mouseoverListener = dataLayer.addListener('mouseover', (event) => {
            const countryName = event.feature.getProperty('name');
            dataLayer.revertStyle();

            dataLayer.overrideStyle(event.feature, {
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: '#fff',
                fillColor: countryName === targetCountry ? '#FF1493' : '#555555'
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

export default function GlobePage() {
    const [viewMode, setViewMode] = useState('state'); // 'state' or 'country'
    const [hoveredState, setHoveredState] = useState(null);
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [devOutlines, setDevOutlines] = useState(false);

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
                    backgroundColor: 'rgba(20, 20, 25, 0.9)',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    zIndex: 10,
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    minWidth: '250px',
                    maxWidth: '350px'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        {viewMode === 'state' ? 'State Overview' : 'Country Overview'}
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
                        hoveredCountry ? (
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#9400D3', marginBottom: '8px' }}>
                                    {hoveredCountry}
                                </div>
                                {hoveredCountry === MOCK_ML_DATA.country ? (
                                    <div>
                                        <div style={{ color: '#ffb347', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.95rem' }}>
                                            Predicted Highest Impact
                                        </div>
                                        <div style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                            {MOCK_ML_DATA.momentumForecast}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#aaa', fontStyle: 'italic', padding: '10px 0' }}>
                                        No momentum data available for this region.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: '#aaa', fontStyle: 'italic', padding: '10px 0' }}>
                                Hover over a highlighted country to view predictive insights.
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
                            <CountriesLayer onHoverCountry={setHoveredCountry} targetCountry={MOCK_ML_DATA.country} devOutlines={devOutlines} />
                        )}
                    </Map>
                </APIProvider>
            </div>
        </div>
    );
}
