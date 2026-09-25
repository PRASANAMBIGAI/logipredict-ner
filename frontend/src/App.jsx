import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FieldReport from './pages/FieldReport';
import Landing from './pages/Landing';
import { Box, Wifi, WifiOff } from 'lucide-react';

function Navigation({ isOnline }) {
  const location = useLocation();
  
  // Hide global nav on Landing page
  if (location.pathname === '/') return null;

  return (
    <nav className="border-b border-gray-200 bg-white/90 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <Box className="w-8 h-8 text-brandAccent" />
              <span className="font-bold text-xl tracking-wider text-textMain">LOGIPREDICT AI <span className="text-sm font-normal text-brandHighlight">NER EDITION</span></span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="text-textMuted hover:text-brandAccent transition-colors text-sm font-medium">DASHBOARD</Link>
            <Link to="/field" className="text-textMuted hover:text-brandAccent transition-colors text-sm font-medium">FIELD APP</Link>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <span className="flex items-center text-success text-xs font-medium bg-success/10 px-2 py-1 rounded">
                  <Wifi className="w-3 h-3 mr-1" /> ONLINE
                </span>
              ) : (
                <span className="flex items-center text-danger text-xs font-medium bg-danger/10 px-2 py-1 rounded">
                  <WifiOff className="w-3 h-3 mr-1" /> OFFLINE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-lightBg text-textMain">
        <Navigation isOnline={isOnline} />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/field" element={<FieldReport isOnline={isOnline} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
