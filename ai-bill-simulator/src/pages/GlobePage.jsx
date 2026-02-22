import { useEffect, useRef, useState } from 'react';
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

// Interpolate color from Red to Blue based on ratio (0 to 1)
const interpolateHeatmapColor = (ratio) => {
    // Red: rgb(255, 0, 0)
    // Blue: rgb(0, 0, 255)
    // We can output a hex string. 
    // Low activity (ratio near 0) -> more Red
    // High activity (ratio near 1) -> more Blue

    // Clamp securely between 0 and 1
    const safeRatio = Math.max(0, Math.min(1, ratio));

    const r = Math.round(255 * (1 - safeRatio));
    const g = 0; // Pure red -> pure blue gives purple in between. Or we could use a different gradient if requested, but pure red/blue requested.
    const b = Math.round(255 * safeRatio);

    return `rgb(${r}, ${g}, ${b})`;
};

// Reusable Layer for US States GeoJSON
const USStatesLayer = ({ onHoverState }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !window.google) return;

        // Ensure we only load GeoJSON once for the map instance
        if (!map.data._usStatesLoaded) {
            map.data.loadGeoJson('/us-states.json');
            map.data._usStatesLoaded = true;
        }

        // Style the states
        map.data.setStyle((feature) => {
            const stateName = feature.getProperty('name');
            const data = getBaseStateData(stateName);

            // Calculate ratio based on enacted bills (Texas has the max at 25 in this dataset)
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

        // Hover events
        const mouseoverListener = map.data.addListener('mouseover', (event) => {
            map.data.revertStyle();
            map.data.overrideStyle(event.feature, {
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: '#fff'
            });
            const stateName = event.feature.getProperty('name');
            onHoverState(stateName);
        });

        const mouseoutListener = map.data.addListener('mouseout', (event) => {
            map.data.revertStyle();
            onHoverState(null);
        });

        return () => {
            window.google.maps.event.removeListener(mouseoverListener);
            window.google.maps.event.removeListener(mouseoutListener);
            // Do not remove features on cleanup, map instance retains them.
        };
    }, [map, onHoverState]);

    return null;
};

USStatesLayer.propTypes = {
    onHoverState: PropTypes.func.isRequired,
};

export default function GlobePage() {
    // State to track the currently hovered state from GeoJSON
    const [hoveredState, setHoveredState] = useState(null);

    return (
        <div className="globe-page-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Header Overlay UI */}
            <div className="globe-header" style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(20, 20, 25, 0.9)',
                padding: '15px 20px',
                borderRadius: '8px',
                border: '1px solid #444',
                zIndex: 10,
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                maxWidth: '350px'
            }}>
                <h2 style={{ fontSize: '1.25rem', margin: '0 0 8px 0' }}>Global Policy Insights</h2>
                <p style={{ color: '#aaa', fontSize: '0.85rem', margin: 0 }}>
                    This map visualizes AI policy data over specific geographical regions. Toggle regions on or off using the checklist.
                </p>
            </div>

            <div style={{ width: '100%', height: '100%', position: 'relative' }}>

                {/* State Info Overlay UI */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    backgroundColor: 'rgba(20, 20, 25, 0.9)',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    zIndex: 10, // Ensure it floats above the map
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    minWidth: '250px'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        State Overview
                    </h3>

                    {hoveredState ? (
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
                        <USStatesLayer onHoverState={setHoveredState} />
                    </Map>
                </APIProvider>
            </div>
        </div>
    );
}
