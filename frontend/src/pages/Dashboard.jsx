import React, { useState, useEffect, useRef } from 'react';
import { api, getWsUrl } from '../utils/api';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { AlertTriangle, Activity, Navigation2, CheckCircle, TrendingUp, CloudRain, Sun, Cloud, CloudLightning, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const GOOGLE_MAPS_API_KEY = import.meta.env.GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const OPENWEATHER_API_KEY = import.meta.env.OPENWEATHER_API_KEY || import.meta.env.VITE_OPENWEATHER_API_KEY;

const getRiskColor = (score) => {
  if (score < 30) return '#52c41a'; // green
  if (score < 60) return '#faad14'; // amber
  return '#ff4d4f'; // red
};

// Custom Polyline Component for Google Maps
const Polyline = ({ path, options, onClick }) => {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!polylineRef.current && window.google) {
      polylineRef.current = new window.google.maps.Polyline(options);
      
      if (onClick) {
        polylineRef.current.addListener('click', onClick);
      }
    }
    if (polylineRef.current) {
        polylineRef.current.setOptions(options);
        polylineRef.current.setPath(path);
    }
  }, [path, options, onClick]);

  useEffect(() => {
    if (polylineRef.current && map) {
      polylineRef.current.setMap(map);
    }
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map]);

  return null;
};

const WeatherIcon = ({ condition }) => {
    const code = condition?.toLowerCase() || '';
    if (code.includes('rain') || code.includes('drizzle')) return <CloudRain className="w-4 h-4 text-blue-500" />;
    if (code.includes('thunderstorm')) return <CloudLightning className="w-4 h-4 text-yellow-500" />;
    if (code.includes('cloud')) return <Cloud className="w-4 h-4 text-gray-400" />;
    return <Sun className="w-4 h-4 text-yellow-400" />;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [routePlan, setRoutePlan] = useState(null);
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [optMode, setOptMode] = useState('fastest');
  const [weatherData, setWeatherData] = useState({});
  const [droneDispatched, setDroneDispatched] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  
  // Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
      { role: 'ai', content: 'Hello! I am LogiPredict Copilot. How can I assist you with NER logistics today?' }
  ]);
  const [isChatting, setIsChatting] = useState(false);
  
  // InfoWindow states
  const [openInfoWindow, setOpenInfoWindow] = useState(null); // { type: 'district' | 'incident' | 'vehicle', data: object }

  useEffect(() => {
    let ws;
    let pollInterval;
    
    const fetchData = async () => {
      try {
        const res = await api.get('/api/dashboard');
        setData(res.data);
        fetchWeatherForDistricts(res.data.districts);
      } catch (e) {
        console.error(e);
      }
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

  const fetchWeatherForDistricts = async (districts) => {
      if (!OPENWEATHER_API_KEY) return;
      const weatherUpdates = {};
      for (const d of districts) {
          try {
              const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${d.lat}&lon=${d.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`);
              const wData = await res.json();
              weatherUpdates[d.id] = {
                  temp: Math.round(wData.main.temp),
                  condition: wData.weather[0].main,
                  desc: wData.weather[0].description
              };
          } catch (e) {
              console.error(`Failed to fetch weather for ${d.name}`, e);
          }
      }
      setWeatherData(prev => ({...prev, ...weatherUpdates}));
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

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);
    
    try {
        const res = await api.post('/api/chat', { message: userMsg });
        setChatHistory(prev => [...prev, { role: 'ai', content: res.data.response }]);
    } catch (e) {
        setChatHistory(prev => [...prev, { role: 'ai', content: 'Sorry, I am offline right now.' }]);
    } finally {
        setIsChatting(false);
    }
  };

  if (!data) return <div className="flex-1 flex items-center justify-center text-brandAccent">Initializing Intelligence Core...</div>;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
      {/* Left Panel: Map */}
      <div className="flex-1 glass-panel flex flex-col overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[1000] glass-panel px-4 py-2 text-sm font-semibold tracking-wider text-textMain shadow-lg flex items-center gap-4">
          GIS CONTROL TOWER
          {Object.keys(weatherData).length > 0 && (
             <span className="text-xs flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded">
                 <CheckCircle className="w-3 h-3" /> Live Weather Sync
             </span>
          )}
        </div>

        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map 
                defaultCenter={{ lat: 25.5788, lng: 92.5 }} 
                defaultZoom={7} 
                mapId="logipredict_map"
                disableDefaultUI={true}
                zoomControl={true}
                className="flex-1 w-full z-0"
            >
                {/* Segments */}
                {data.segments.map(seg => {
                    const isSelected = selectedSegment?.id === seg.id;
                    const isRouted = routePlan?.primary_route.includes(seg.id);
                    const isHoverable = true; // Google maps polylines hover logic can be added via events if needed
                    return (
                        <Polyline 
                            key={`seg-${seg.id}`}
                            path={[
                                {lat: seg.start_lat, lng: seg.start_lng},
                                {lat: seg.end_lat, lng: seg.end_lng}
                            ]}
                            options={{
                                strokeColor: isSelected ? '#8b5cf6' : getRiskColor(seg.current_risk_score),
                                strokeOpacity: (isRouted || isSelected) ? 1.0 : 0.85,
                                strokeWeight: (isRouted || isSelected) ? 8 : 4,
                                clickable: true,
                            }}
                            onClick={() => handleSegmentClick(seg)}
                        />
                    )
                })}

                {/* Drone Route */}
                {droneDispatched && routePlan && (
                    <Polyline 
                         path={[
                            {lat: data.districts.find(d => d.id === parseInt(origin)).lat, lng: data.districts.find(d => d.id === parseInt(origin)).lng},
                            {lat: data.districts.find(d => d.id === parseInt(dest)).lat, lng: data.districts.find(d => d.id === parseInt(dest)).lng}
                         ]}
                         options={{
                             strokeColor: '#3b82f6',
                             strokeOpacity: 0.8,
                             strokeWeight: 4,
                             geodesic: true // Makes it a curved line
                         }}
                    />
                )}

                {/* Districts */}
                {data.districts.map(d => (
                    <AdvancedMarker 
                        key={`dist-${d.id}`} 
                        position={{ lat: d.lat, lng: d.lng }}
                        onClick={() => setOpenInfoWindow({ type: 'district', data: d })}
                    >
                        <div className="bg-blue-900 border-2 border-white rounded-full flex flex-col items-center justify-center p-1 shadow-lg transform transition-transform hover:scale-110">
                             <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                    </AdvancedMarker>
                ))}

                {/* Vehicles */}
                {data.vehicles.map(v => (
                    <AdvancedMarker 
                        key={`veh-${v.id}`} 
                        position={{ lat: v.current_lat, lng: v.current_lng }}
                        onClick={() => setOpenInfoWindow({ type: 'vehicle', data: v })}
                    >
                        <Pin background={'#0f172a'} glyphColor={'white'} borderColor={'#0f172a'} />
                    </AdvancedMarker>
                ))}

                {/* Incidents */}
                {data.incidents.map(inc => (
                    <AdvancedMarker 
                        key={`inc-${inc.id}`} 
                        position={{ lat: inc.lat, lng: inc.lng }}
                        onClick={() => setOpenInfoWindow({ type: 'incident', data: inc })}
                    >
                        <div className="bg-red-500 rounded-full p-1 shadow-md animate-pulse">
                            <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                    </AdvancedMarker>
                ))}

                {/* Info Windows */}
                {openInfoWindow && openInfoWindow.type === 'district' && (
                    <InfoWindow 
                        position={{ lat: openInfoWindow.data.lat, lng: openInfoWindow.data.lng }}
                        onCloseClick={() => setOpenInfoWindow(null)}
                        pixelOffset={[0, -20]}
                    >
                        <div className="p-1 font-sans text-gray-900 min-w-[120px]">
                            <div className="font-bold text-blue-900 text-sm">{openInfoWindow.data.name}</div>
                            <div className="text-xs text-gray-600 mb-2">Distribution Hub</div>
                            
                            {weatherData[openInfoWindow.data.id] && (
                                <div className="border-t pt-2 mt-1 flex items-center gap-2">
                                    <WeatherIcon condition={weatherData[openInfoWindow.data.id].condition} />
                                    <div>
                                        <div className="font-bold text-lg leading-none">{weatherData[openInfoWindow.data.id].temp}°C</div>
                                        <div className="text-[10px] text-gray-500 capitalize">{weatherData[openInfoWindow.data.id].desc}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </InfoWindow>
                )}

                {openInfoWindow && openInfoWindow.type === 'vehicle' && (
                    <InfoWindow 
                        position={{ lat: openInfoWindow.data.current_lat, lng: openInfoWindow.data.current_lng }}
                        onCloseClick={() => setOpenInfoWindow(null)}
                    >
                         <div className="text-gray-900 font-sans p-1">
                            <strong className="text-sm">{openInfoWindow.data.vehicle_number}</strong><br/>
                            <span className="text-xs">Cargo: {openInfoWindow.data.cargo_type}</span><br/>
                            <span className="text-xs font-semibold text-blue-600">Status: {openInfoWindow.data.status}</span>
                        </div>
                    </InfoWindow>
                )}

                 {openInfoWindow && openInfoWindow.type === 'incident' && (
                    <InfoWindow 
                        position={{ lat: openInfoWindow.data.lat, lng: openInfoWindow.data.lng }}
                        onCloseClick={() => setOpenInfoWindow(null)}
                    >
                         <div className="text-gray-900 font-sans p-1 max-w-[200px]">
                            <strong className="text-sm text-red-600">{openInfoWindow.data.incident_type.toUpperCase()}</strong><br/>
                            <span className="text-xs">Severity: {openInfoWindow.data.severity}</span><br/>
                            <span className="text-xs text-gray-500">By: {openInfoWindow.data.reporter_name}</span><br/>
                            <p className="text-xs mt-1 bg-gray-50 p-1 rounded border">{openInfoWindow.data.notes}</p>
                        </div>
                    </InfoWindow>
                )}

            </Map>
        </APIProvider>
      </div>

      {/* Right Panel: Controls & Feeds */}
      <div className="w-full md:w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* AI Copilot Widget */}
        <div className="glass-panel p-5 flex flex-col max-h-[300px]">
          <h2 className="text-sm font-bold text-blue-700 mb-4 flex items-center">
            <Bot className="w-4 h-4 mr-2" /> LOGIPREDICT COPILOT
          </h2>
          <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-2 text-sm custom-scrollbar">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`p-2 rounded max-w-[85%] ${msg.role === 'ai' ? 'bg-blue-50 text-blue-900 border border-blue-100 self-start mr-auto' : 'bg-gray-100 text-gray-800 border border-gray-200 ml-auto'}`}>
                {msg.content}
              </div>
            ))}
            {isChatting && <div className="text-xs text-gray-400 italic">Thinking...</div>}
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={chatMessage} 
              onChange={(e) => setChatMessage(e.target.value)} 
              placeholder="Ask about routes, weather..." 
              className="flex-1 bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={isChatting || !chatMessage.trim()} className="bg-blue-600 text-white px-3 rounded font-bold hover:bg-blue-500 disabled:opacity-50 text-sm">
              Ask
            </button>
          </form>
        </div>
        
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
                <strong>Model Inference:</strong> Based on historical geology (Base Risk: {forecastData.base_risk}) and real-time inputs, this segment has an estimated {forecastData.forecast[6].probability}% probability of blockage within 7 days.
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
