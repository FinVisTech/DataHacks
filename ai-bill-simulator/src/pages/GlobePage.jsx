import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

// Real State AI Legislation Data (2024 approximations)
const LEGISLATION_DATA = {
    "Alabama": { proposed: 3, passed: 0 },
    "Alaska": { proposed: 2, passed: 0 },
    "Arizona": { proposed: 4, passed: 1 },
    "Arkansas": { proposed: 1, passed: 0 },
    "California": { proposed: 65, passed: 18 },
    "Colorado": { proposed: 15, passed: 3 },
    "Connecticut": { proposed: 12, passed: 2 },
    "Delaware": { proposed: 2, passed: 0 },
    "Florida": { proposed: 14, passed: 2 },
    "Georgia": { proposed: 6, passed: 0 },
    "Hawaii": { proposed: 8, passed: 1 },
    "Idaho": { proposed: 2, passed: 0 },
    "Illinois": { proposed: 22, passed: 4 },
    "Indiana": { proposed: 5, passed: 1 },
    "Iowa": { proposed: 3, passed: 0 },
    "Kansas": { proposed: 2, passed: 0 },
    "Kentucky": { proposed: 4, passed: 0 },
    "Louisiana": { proposed: 7, passed: 1 },
    "Maine": { proposed: 5, passed: 1 },
    "Maryland": { proposed: 18, passed: 3 },
    "Massachusetts": { proposed: 25, passed: 4 },
    "Michigan": { proposed: 11, passed: 1 },
    "Minnesota": { proposed: 10, passed: 2 },
    "Mississippi": { proposed: 2, passed: 0 },
    "Missouri": { proposed: 6, passed: 0 },
    "Montana": { proposed: 1, passed: 0 },
    "Nebraska": { proposed: 2, passed: 0 },
    "Nevada": { proposed: 3, passed: 1 },
    "New Hampshire": { proposed: 8, passed: 1 },
    "New Jersey": { proposed: 20, passed: 3 },
    "New Mexico": { proposed: 4, passed: 0 },
    "New York": { proposed: 45, passed: 5 },
    "North Carolina": { proposed: 6, passed: 0 },
    "North Dakota": { proposed: 1, passed: 0 },
    "Ohio": { proposed: 9, passed: 0 },
    "Oklahoma": { proposed: 8, passed: 1 },
    "Oregon": { proposed: 10, passed: 2 },
    "Pennsylvania": { proposed: 16, passed: 2 },
    "Rhode Island": { proposed: 7, passed: 1 },
    "South Carolina": { proposed: 4, passed: 0 },
    "South Dakota": { proposed: 1, passed: 0 },
    "Tennessee": { proposed: 8, passed: 2 },
    "Texas": { proposed: 12, passed: 2 },
    "Utah": { proposed: 11, passed: 3 },
    "Vermont": { proposed: 6, passed: 1 },
    "Virginia": { proposed: 15, passed: 3 },
    "Washington": { proposed: 18, passed: 4 },
    "West Virginia": { proposed: 3, passed: 0 },
    "Wisconsin": { proposed: 7, passed: 1 },
    "Wyoming": { proposed: 1, passed: 0 },
    "District of Columbia": { proposed: 4, passed: 0 },
    "Puerto Rico": { proposed: 1, passed: 0 }
};

const getBaseStateData = (stateName) => {
    return LEGISLATION_DATA[stateName] || { proposed: 0, passed: 0 };
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

            // Color based on proposed bill volume (as an activity metric)
            let fillColor = '#1a1a2e'; // dark blue/gray for 0
            if (data.proposed > 30) fillColor = '#007FFF';
            else if (data.proposed > 10) fillColor = '#0055aa';
            else if (data.proposed > 0) fillColor = '#003366';

            return {
                fillColor: fillColor,
                fillOpacity: data.proposed > 0 ? 0.6 : 0.2,
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
                                <span style={{ color: '#aaa' }}>Number of AI Bills Passed:</span>
                                <span style={{ fontWeight: 'bold', color: getBaseStateData(hoveredState).passed > 0 ? '#32CD32' : 'inherit' }}>
                                    {getBaseStateData(hoveredState).passed}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #333' }}>
                                <span style={{ color: '#aaa' }}>Activity Level:</span>
                                <span style={{ fontWeight: 'bold', color: getBaseStateData(hoveredState).proposed > 20 ? '#32CD32' : (getBaseStateData(hoveredState).proposed > 0 ? '#007FFF' : '#FFD700') }}>
                                    {getBaseStateData(hoveredState).proposed > 20 ? 'Highly Active' : (getBaseStateData(hoveredState).proposed > 0 ? 'Active' : 'Inactive')}
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
