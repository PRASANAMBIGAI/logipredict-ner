import React, { useState, useEffect } from 'react';
import { api, getWsUrl } from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Activity, Navigation2, CheckCircle, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import L from 'leaflet';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getRiskColor = (score) => {
  if (score < 30) return '#52c41a'; // green
  if (score < 60) return '#faad14'; // amber
  return '#ff4d4f'; // red
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [routePlan, setRoutePlan] = useState(null);
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [optMode, setOptMode] = useState('fastest');
  const [weatherRadar, setWeatherRadar] = useState(false);
  const [droneDispatched, setDroneDispatched] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  useEffect(() => {
    let ws;
    let pollInterval;
    
    const fetchData = () => {
      api.get('/api/dashboard').then(res => setData(res.data)).catch(console.error);
    };
    
    // Initial fetch
    fetchData();

    const connectWs = () => {
      ws = new WebSocket(getWsUrl());
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'NEW_INCIDENT') {
          setData(prev => ({ ...prev, incidents: [...prev.incidents, message.data] }));
          fetchData();
        } else if (message.type === 'NEW_ALERT') {
          setData(prev => ({ ...prev, alerts: [message.data, ...prev.alerts] }));
        } else if (message.type === 'REFRESH_MAP') {
          fetchData();
        }
      };
      ws.onerror = () => {
        console.error('WebSocket error');
      };
      ws.onclose = () => {
        console.warn('WebSocket closed, falling back to polling.');
        if (!pollInterval) pollInterval = setInterval(fetchData, 10000);
      };
    };
    
    connectWs();
    
    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const toggleWeather = async () => {
    const newState = !weatherRadar;
    setWeatherRadar(newState);
    await api.post('/api/weather/toggle', { active: newState });
  };

  const handleRouteRequest = async () => {
    if (!origin || !dest) return;
    setLoadingRoute(true);
    try {
      setDroneDispatched(false);
      const res = await api.post('/api/route', {
        origin_district_id: parseInt(origin),
        dest_district_id: parseInt(dest),
        optimization_mode: optMode
      });
      setRoutePlan(res.data);
    } catch (e) {
      alert("Error finding route or no route available.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleSegmentClick = async (seg) => {
    setSelectedSegment(seg);
    setLoadingForecast(true);
    try {
      const res = await api.get(`/api/predict/${seg.id}`);
      setForecastData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingForecast(false);
    }
  };

  if (!data) return <div className="flex-1 flex items-center justify-center text-brandAccent">Initializing Intelligence Core...</div>;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
      {/* Left Panel: Map */}
      <div className="flex-1 glass-panel flex flex-col overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[1000] glass-panel px-4 py-2 text-sm font-semibold tracking-wider text-textMain shadow-lg flex items-center gap-4">
          GIS CONTROL TOWER
          
          <button 
            onClick={toggleWeather}
            className={`px-3 py-1 text-xs rounded-full font-bold transition-colors ${weatherRadar ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {weatherRadar ? 'MONSOON RADAR: ACTIVE' : 'WEATHER RADAR: OFF'}
          </button>
        </div>
        
        {weatherRadar && (
          <div className="absolute inset-0 z-[500] pointer-events-none bg-blue-900/20 mix-blend-multiply" />
        )}

        <MapContainer center={[25.5788, 92.5]} zoom={7} className="flex-1 w-full z-0" style={{ background: '#E5E7EB' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          
          {droneDispatched && routePlan && (
            <Polyline 
              positions={[
                [data.districts.find(d => d.id === parseInt(origin)).lat, data.districts.find(d => d.id === parseInt(origin)).lng],
                [data.districts.find(d => d.id === parseInt(dest)).lat, data.districts.find(d => d.id === parseInt(dest)).lng]
              ]}
              color="#3b82f6"
              weight={4}
              dashArray="5, 10"
              className="animate-pulse"
            />
          )}
          
          {/* Render Districts (Cities) */}
          {data.districts.map(d => (
            <Marker 
              key={`dist-${d.id}`} 
              position={[d.lat, d.lng]}
              icon={new L.DivIcon({
                className: 'custom-district-icon',
                html: `<div style="background-color: #1e3a8a; color: white; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              })}
            >
              <Popup>
                <div className="font-bold text-blue-900">{d.name}</div>
                <div className="text-xs text-gray-600">Distribution Hub</div>
              </Popup>
            </Marker>
          ))}
          
          {/* Render Segments */}
          {data.segments.map(seg => (
            <Polyline 
              key={`seg-${seg.id}`}
              positions={[[seg.start_lat, seg.start_lng], [seg.end_lat, seg.end_lng]]}
              color={selectedSegment?.id === seg.id ? '#8b5cf6' : getRiskColor(seg.current_risk_score)}
              weight={routePlan?.primary_route.includes(seg.id) || selectedSegment?.id === seg.id ? 8 : 4}
              opacity={routePlan?.primary_route.includes(seg.id) || selectedSegment?.id === seg.id ? 1 : 0.85}
              dashArray={routePlan?.primary_route.includes(seg.id) ? "10, 10" : null}
              eventHandlers={{ click: () => handleSegmentClick(seg) }}
            >
              <Popup>
                <div className="text-gray-900 font-sans">
                  <strong>{seg.name}</strong><br/>
                  Risk Score: {seg.current_risk_score.toFixed(1)}<br/>
                  Distance: {seg.distance_km} km<br/>
                  <span className="text-xs text-brandAccent">Click segment for AI Prediction</span>
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Render Vehicles */}
          {data.vehicles.map(v => (
            <Marker key={`veh-${v.id}`} position={[v.current_lat, v.current_lng]}>
              <Popup>
                <div className="text-gray-900">
                  <strong>{v.vehicle_number}</strong><br/>
                  Cargo: {v.cargo_type}<br/>
                  Status: {v.status}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Render Incidents */}
          {data.incidents.map(inc => (
            <Marker key={`inc-${inc.id}`} position={[inc.lat, inc.lng]}>
              <Popup>
                <div className="text-gray-900">
                  <strong>{inc.incident_type.toUpperCase()}</strong><br/>
                  Severity: {inc.severity}<br/>
                  Reporter: {inc.reporter_name}<br/>
                  {inc.notes}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Right Panel: Controls & Feeds */}
      <div className="w-full md:w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Route Planner Widget */}
        <div className="glass-panel p-5">
          <h2 className="text-sm font-bold text-brandAccent mb-4 flex items-center">
            <Navigation2 className="w-4 h-4 mr-2" /> DYNAMIC REROUTING
          </h2>
          <div className="space-y-3">
            <select className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-textMain outline-none focus:border-brandHighlight transition-colors" value={origin} onChange={e => setOrigin(e.target.value)}>
              <option value="">Select Origin...</option>
              {data.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="w-full bg-white border border-gray-300 rounded p-2 text-sm text-textMain outline-none focus:border-brandHighlight transition-colors" value={dest} onChange={e => setDest(e.target.value)}>
              <option value="">Select Destination...</option>
              {data.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setOptMode('fastest')} 
                className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${optMode === 'fastest' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
              >
                FASTEST
              </button>
              <button 
                onClick={() => setOptMode('eco')} 
                className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${optMode === 'eco' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}
              >
                ECO ROUTE (SAVE FUEL)
              </button>
            </div>
            <button onClick={handleRouteRequest} disabled={loadingRoute} className="w-full btn-primary py-3 text-sm tracking-wide">
              {loadingRoute ? 'COMPUTING INFERENCE...' : 'OPTIMIZE ROUTE'}
            </button>

            {routePlan && (
              <div className="mt-4 p-3 bg-brandHighlight/10 border border-brandHighlight/30 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 font-medium">Est. Transit Time:</span>
                  <span className="font-bold text-brandAccent">{routePlan.estimated_time_mins} mins</span>
                </div>
                {routePlan.has_blocked_segments ? (
                  <div className="flex items-center text-danger mt-2">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Primary path blocked. Detour suggested.
                  </div>
                ) : (
                  <div className="flex items-center text-success mt-2">
                    <CheckCircle className="w-4 h-4 mr-1" /> Path is clear of severe risks.
                  </div>
                )}
                
                {routePlan.fuel_saved_percent > 0 && (
                  <div className="text-green-600 font-bold text-xs mt-2 bg-green-50 p-1 rounded">
                    🌿 Eco Mode: ~{routePlan.fuel_saved_percent}% Fuel Saved
                  </div>
                )}

                {routePlan.drone_dispatch_recommended && !droneDispatched && (
                  <button 
                    onClick={() => setDroneDispatched(true)}
                    className="mt-3 w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded text-xs font-bold transition-colors animate-pulse"
                  >
                    DEPLOY EMERGENCY DRONE
                  </button>
                )}
                {droneDispatched && (
                   <div className="mt-3 w-full bg-blue-600 text-white py-2 rounded text-xs font-bold text-center">
                   DRONE EN ROUTE VIA DIRECT VECTOR
                 </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Predictive Forecast Widget */}
        <div className="glass-panel p-5">
          <h2 className="text-sm font-bold text-purple-700 mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" /> AI PREDICTIVE FORECAST
          </h2>
          
          {!selectedSegment ? (
            <div className="text-xs text-gray-500 italic p-4 text-center border border-dashed rounded">
              Select a road segment on the map to run the heuristic prediction algorithm.
            </div>
          ) : loadingForecast ? (
            <div className="text-xs text-brandAccent text-center p-4">Running Inference Model...</div>
          ) : forecastData ? (
            <div>
              <div className="text-xs font-bold text-gray-700 mb-2">{forecastData.segment_name}</div>
              <div className="h-32 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData.forecast} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '4px' }} />
                    <Area type="monotone" dataKey="probability" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProb)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-[10px] text-purple-900 leading-tight">
                <strong>Model Inference:</strong> Based on historical geology (Base Risk: {forecastData.base_risk}) and simulated monsoon saturation patterns, this segment has an estimated {forecastData.forecast[6].probability}% probability of blockage within 7 days.
                {forecastData.forecast[6].probability > 80 && " Pre-emptive rerouting highly recommended."}
              </div>
            </div>
          ) : null}
        </div>

        {/* Live Alerts Feed */}
        <div className="glass-panel p-5 flex-1 flex flex-col min-h-[250px]">
          <h2 className="text-sm font-bold text-brandHighlight mb-4 flex items-center">
            <Activity className="w-4 h-4 mr-2" /> INTELLIGENCE STREAM
          </h2>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {data.alerts.length === 0 && <div className="text-sm text-gray-500 italic">No active anomalies detected.</div>}
            {data.alerts.map((alert, i) => {
              const isMesh = alert.message.includes('Relayed via Mesh Node');
              return (
              <div key={i} className={`p-3 rounded border text-sm relative ${alert.severity === 'HIGH' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-brandHighlight/10 border-brandHighlight/30 text-brandHighlight'}`}>
                {isMesh && (
                  <div className="absolute top-2 right-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                    MESH RELAYED
                  </div>
                )}
                <div className="font-bold mb-1 text-xs">{alert.type}</div>
                <div>{alert.message.replace(' (Relayed via Mesh Node)', '')}</div>
                <div className="text-[10px] mt-2 opacity-70">Timestamp: {new Date(alert.created_at || Date.now()).toLocaleTimeString()}</div>
              </div>
            )})}
          </div>
        </div>

      </div>
    </div>
  );
}
