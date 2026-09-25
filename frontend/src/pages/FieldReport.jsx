import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Camera, Send, RefreshCw, CheckCircle, AlertTriangle, Mic } from 'lucide-react';

export default function FieldReport({ isOnline }) {
  const [segments, setSegments] = useState([]);
  const [formData, setFormData] = useState({
    road_segment_id: '',
    reporter_name: 'Field Officer Default',
    incident_type: 'landslide',
    severity: 'partial',
    notes: ''
  });
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    // Attempt to load queued reports from localStorage
    const saved = localStorage.getItem('offlineQueue');
    if (saved) setQueue(JSON.parse(saved));

    // Fetch initial segments for dropdown if online
    if (isOnline) {
      api.get('/api/dashboard').then(res => setSegments(res.data.segments)).catch(() => {});
    } else {
      // Mock segments if totally offline on first load
      setSegments([
        { id: 1, name: "Guwahati-Shillong Highway" },
        { id: 2, name: "Shillong-Silchar Route" }
      ]);
    }

    // Auto-capture GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.warn("GPS failed", err)
      );
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      handleSync();
    }
  }, [isOnline]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.road_segment_id) return alert("Select a segment");
    
    const payload = {
      ...formData,
      road_segment_id: parseInt(formData.road_segment_id),
      lat: coords.lat,
      lng: coords.lng,
      timestamp: new Date().toISOString()
    };

    if (isOnline) {
      try {
        await api.post('/api/incidents', payload);
        alert("Report submitted successfully.");
      } catch (err) {
        queueReport(payload);
      }
    } else {
      queueReport(payload);
    }
  };

  const queueReport = (payload) => {
    const newQueue = [...queue, { ...payload, tempId: Date.now() }];
    setQueue(newQueue);
    localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
    alert("Offline mode: Report queued for sync.");
  };

  const handleSync = async () => {
    setSyncing(true);
    const newQueue = [...queue];
    const failed = [];
    for (const item of newQueue) {
      try {
        await api.post('/api/incidents', item);
      } catch (e) {
        failed.push(item);
      }
    }
    setQueue(failed);
    localStorage.setItem('offlineQueue', JSON.stringify(failed));
    setSyncing(false);
  };

  const startVoiceDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice dictation is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({ ...prev, notes: prev.notes ? prev.notes + ' ' + transcript : transcript }));
    };
    
    recognition.onerror = (event) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const startCamera = async () => {
    setShowCamera(true);
    setPhotoData(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or unavailable.");
      setShowCamera(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 300, 225);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      setPhotoData(dataUrl);
      setFormData(prev => ({ ...prev, photo_url: dataUrl }));
      stopCamera();
      
      // AI Vision Analysis
      setAnalyzingImage(true);
      try {
        const res = await api.post('/api/vision/analyze', {
          photo_url: dataUrl,
          incident_type: formData.incident_type
        });
        const aiText = res.data.description;
        setFormData(prev => ({ 
            ...prev, 
            notes: prev.notes ? prev.notes + '\n\n' + aiText : aiText 
        }));
      } catch(e) {
        console.error("Vision AI failed", e);
      } finally {
        setAnalyzingImage(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setShowCamera(false);
  };

  const simulateMeshRelay = async (item) => {
    // Force send even if offline, simulating passing it to another node
    try {
      await api.post('/api/incidents', { ...item, relayed_via_mesh: true });
      alert("Report successfully relayed via Mesh Network!");
      const newQueue = queue.filter(q => q.tempId !== item.tempId);
      setQueue(newQueue);
      localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
    } catch (e) {
      alert("Mesh Relay failed (Backend unreachable).");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-6">
        <h2 className="text-xl font-bold text-textMain mb-6 text-center">FIELD REPORTING APP</h2>
        
        {!isOnline && (
          <div className="bg-warning/20 border border-warning/50 text-warning p-3 rounded mb-4 text-sm flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
            <span>You are currently offline. Reports will be saved locally and synced when connection is restored.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">ROAD SEGMENT</label>
            <select 
              className="w-full bg-white border border-gray-300 rounded p-3 text-sm text-textMain focus:border-brandHighlight outline-none"
              value={formData.road_segment_id}
              onChange={e => setFormData({...formData, road_segment_id: e.target.value})}
            >
              <option value="">Select Segment...</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">INCIDENT TYPE</label>
            <select 
              className="w-full bg-white border border-gray-300 rounded p-3 text-sm text-textMain focus:border-brandHighlight outline-none"
              value={formData.incident_type}
              onChange={e => setFormData({...formData, incident_type: e.target.value})}
            >
              <option value="landslide">Landslide</option>
              <option value="flood">Flood</option>
              <option value="road_damage">Road Damage</option>
              <option value="bridge_damage">Bridge Damage</option>
              <option value="breakdown">Vehicle Breakdown</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">SEVERITY</label>
            <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
              {['passable', 'partial', 'blocked'].map(sev => (
                <button 
                  key={sev} type="button"
                  onClick={() => setFormData({...formData, severity: sev})}
                  className={`flex-1 py-2 text-xs font-bold uppercase transition-colors ${formData.severity === sev ? 'bg-brandHighlight text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">EVIDENCE PHOTO</label>
            {!showCamera && !photoData && (
              <button type="button" onClick={startCamera} className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 py-3 rounded flex items-center justify-center font-bold text-xs transition-colors">
                <Camera className="w-4 h-4 mr-2" /> CAPTURE PHOTO FROM CAMERA
              </button>
            )}
            {showCamera && (
              <div className="relative rounded overflow-hidden bg-black flex flex-col items-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                <button type="button" onClick={capturePhoto} className="absolute bottom-4 bg-brandHighlight shadow-lg border-2 border-white text-white px-6 py-2 rounded-full font-bold text-xs">
                  TAKE SNAPSHOT
                </button>
                <button type="button" onClick={stopCamera} className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                  X
                </button>
              </div>
            )}
            <canvas ref={canvasRef} width="300" height="225" style={{ display: 'none' }} />
            {photoData && (
              <div className="relative">
                <img src={photoData} alt="Evidence" className="w-full rounded border border-gray-300" />
                <button type="button" onClick={() => { setPhotoData(null); setFormData(p => ({...p, photo_url: ''})); }} className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow">
                  REMOVE
                </button>
                {analyzingImage && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded">
                    <div className="w-8 h-8 border-4 border-brandHighlight border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-white text-xs font-bold animate-pulse">Running AI Vision Analysis...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-600">NOTES</label>
              <button 
                type="button" 
                onClick={startVoiceDictation}
                className={`flex items-center text-[10px] font-bold px-2 py-1 rounded transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}
              >
                <Mic className="w-3 h-3 mr-1" />
                {isListening ? 'LISTENING...' : 'VOICE DICTATION'}
              </button>
            </div>
            <textarea 
              className="w-full bg-white border border-gray-300 rounded p-3 text-sm text-textMain focus:border-brandHighlight outline-none h-24 custom-scrollbar"
              placeholder="Add details... (Or use Voice Dictation)"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center">
            <Send className="w-4 h-4 mr-2" /> SUBMIT REPORT
          </button>
        </form>
      </div>

      {queue.length > 0 && (
        <div className="w-full max-w-md mt-6 glass-panel p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-700">QUEUED REPORTS ({queue.length})</h3>
            <button 
              onClick={handleSync}
              disabled={!isOnline || syncing}
              className="flex items-center text-xs text-brandAccent hover:text-brandAccent/80 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? 'animate-spin' : ''}`} /> SYNC NOW
            </button>
          </div>
          <div className="space-y-2">
            {queue.map(q => (
              <div key={q.tempId} className="flex flex-col text-xs bg-white p-2 rounded border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="uppercase text-brandAccent font-semibold">{q.incident_type}</span>
                  <span className="text-gray-500">{new Date(q.timestamp).toLocaleTimeString()}</span>
                </div>
                {!isOnline && (
                  <button 
                    onClick={() => simulateMeshRelay(q)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 rounded font-bold transition-colors text-[10px]"
                  >
                    SIMULATE MESH RELAY
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
