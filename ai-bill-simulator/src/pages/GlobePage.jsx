import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

// Reusable Polygon Component
const RegionPolygon = ({ paths, color, visible }) => {
    const map = useMap();
    const polygonRef = useRef(null);

    useEffect(() => {
        if (!map || !window.google) return;

        if (!polygonRef.current) {
            polygonRef.current = new window.google.maps.Polygon({
                paths: paths,
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: color,
                fillOpacity: 0.35,
            });
        }

        polygonRef.current.setPaths(paths);

        // Toggle visibility
        if (visible) {
            polygonRef.current.setMap(map);
        } else {
            polygonRef.current.setMap(null);
        }

        return () => {
            // Cleanup on unmount
            if (polygonRef.current) {
                polygonRef.current.setMap(null);
            }
        };
    }, [map, paths, color, visible]);

    return null;
};

import { REGIONS } from '../data/regions';

export default function GlobePage() {
    // State to track which regions are currently toggled on
    const [toggledRegions, setToggledRegions] = useState({
        california: true,
        newYork: false,
        texas: false,
        usa: false
    });
    const [isMenuExpanded, setIsMenuExpanded] = useState(true);

    const handleToggle = (region) => {
        setToggledRegions(prev => ({
            ...prev,
            [region]: !prev[region]
        }));
    };

    return (
        <div className="globe-page-container" style={{ width: '100%', height: 'calc(100vh - 200px)', padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
            <div className="globe-header" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Global Policy Insights</h2>
                <p style={{ color: '#aaa', fontSize: '0.95rem' }}>
                    This map visualizes AI policy data over specific geographical regions. Toggle regions on or off using the checklist.
                </p>
            </div>

            <div style={{ flex: 1, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', position: 'relative' }}>

                {/* Checkbox Overlay UI */}
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
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: isMenuExpanded ? '1px solid #333' : 'none', paddingBottom: isMenuExpanded ? '8px' : '0', marginBottom: isMenuExpanded ? '10px' : '0' }}
                        onClick={() => setIsMenuExpanded(!isMenuExpanded)}
                    >
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Overlays</h3>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', userSelect: 'none' }}>{isMenuExpanded ? '−' : '+'}</span>
                    </div>

                    {isMenuExpanded && (
                        <>
                            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={toggledRegions.california}
                                    onChange={() => handleToggle('california')}
                                    style={{ marginRight: '10px', accentColor: '#007FFF' }}
                                />
                                California Policy
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={toggledRegions.newYork}
                                    onChange={() => handleToggle('newYork')}
                                    style={{ marginRight: '10px', accentColor: '#FF4500' }}
                                />
                                New York Policy
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={toggledRegions.texas}
                                    onChange={() => handleToggle('texas')}
                                    style={{ marginRight: '10px', accentColor: '#32CD32' }}
                                />
                                Texas Policy
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #333' }}>
                                <input
                                    type="checkbox"
                                    checked={toggledRegions.usa}
                                    onChange={() => handleToggle('usa')}
                                    style={{ marginRight: '10px', accentColor: '#9370DB' }}
                                />
                                United States (Federal)
                            </label>
                        </>
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
                        <RegionPolygon paths={REGIONS.california} color="#007FFF" visible={toggledRegions.california} />
                        <RegionPolygon paths={REGIONS.newYork} color="#FF4500" visible={toggledRegions.newYork} />
                        <RegionPolygon paths={REGIONS.texas} color="#32CD32" visible={toggledRegions.texas} />
                        <RegionPolygon paths={REGIONS.usa} color="#9370DB" visible={toggledRegions.usa} />
                    </Map>
                </APIProvider>
            </div>
        </div>
    );
}
