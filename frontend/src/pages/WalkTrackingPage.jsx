import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import WalkMap from '../components/map/WalkMap';
import RoutePolyline from '../components/map/RoutePolyline';
import FitBounds from '../components/map/FitBounds';
import WalkStats from '../components/walk/WalkStats';
import WalkControls from '../components/walk/WalkControls';
import ShareCard from '../components/walk/ShareCard';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWalkTracker } from '../hooks/useWalkTracker';

const currentPositionIcon = L.divIcon({
  className: 'current-pos-marker',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
      <div class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapRecenter({ position }) {
  const map = useMap();
  const [hasRecentered, setHasRecentered] = useState(false);

  useEffect(() => {
    if (position && !hasRecentered) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      map.setView([lat, lng], 15);
      setHasRecentered(true);
    }
  }, [position, hasRecentered, map]);

  return null;
}

export default function WalkTrackingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { position, error: geoError } = useGeolocation();
  const {
    status,
    positions,
    error,
    elapsedSeconds,
    liveDistance,
    startWalk,
    endWalk,
  } = useWalkTracker(position, geoError);

  const [completedWalk, setCompletedWalk] = useState(null);
  const [showShare, setShowShare] = useState(false);

  const mapCenter = positions.length > 0
    ? positions[positions.length - 1]
    : position
      ? [position.coords.latitude, position.coords.longitude]
      : [12.9716, 77.5946];

  const handleStart = async () => {
    try {
      setCompletedWalk(null);
      await startWalk();
    } catch {
      // error shown via error state
    }
  };

  const handleStop = async () => {
    if (!window.confirm('End this walk?')) return;
    try {
      const summary = await endWalk();
      setCompletedWalk(summary);
      setShowShare(true);
      if (summary?.territoryCreated) {
        alert('Territory claimed! You completed a closed-loop walk.');
      }
    } catch {
      // error shown via error state
    }
  };

  const handleCloseShare = () => {
    setShowShare(false);
    if (isAuthenticated && completedWalk?.id) {
      navigate(`/walks/${completedWalk.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Track Walk</h1>

        {(error || geoError) && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400" role="alert">
            {error || geoError}
            {geoError && (
              <p className="mt-2 text-sm text-red-300">Enable location permissions in your browser settings to track walks.</p>
            )}
          </div>
        )}

        <div className="mt-4 h-[60vh] w-full overflow-hidden rounded-xl shadow-lg border border-slate-800">
          <WalkMap center={mapCenter} zoom={15}>
            <RoutePolyline positions={positions} />
            <FitBounds positions={positions} />
            <MapRecenter position={position} />
            {position && (
              <Marker
                position={[position.coords.latitude, position.coords.longitude]}
                icon={currentPositionIcon}
              />
            )}
          </WalkMap>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between bg-slate-900 p-4 rounded-xl border border-slate-850">
          <WalkStats
            distance={liveDistance}
            duration={elapsedSeconds}
            label={status === 'active' ? 'Live' : 'Ready'}
          />
          <WalkControls
            status={status}
            onStart={handleStart}
            onStop={handleStop}
            disabled={!!geoError && status === 'idle'}
          />
        </div>

        {status === 'active' && (
          <p className="mt-2 text-center text-sm text-slate-500">
            Distance shown is a live estimate. Final distance is calculated server-side when you stop.
          </p>
        )}

        {completedWalk && !isAuthenticated && (
          <div className="mt-6 rounded-xl bg-orange-500/10 p-6 border border-orange-500/20 text-center flex flex-col items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Walk Completed! Distance: {(completedWalk.distanceMeters / 1000).toFixed(2)} km</h2>
              <p className="text-sm text-slate-400 mt-1">This walk is saved locally. Register or log in to sync it to your profile and compete on the leaderboard!</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="rounded-lg bg-orange-600 px-6 py-2.5 text-white font-semibold hover:bg-orange-700 transition">
                Sign Up
              </Link>
              <Link to="/login" className="rounded-lg border border-orange-500 px-6 py-2.5 text-orange-400 font-semibold hover:border-orange-600 hover:text-orange-500 transition">
                Log In
              </Link>
              <button
                onClick={() => setShowShare(true)}
                className="rounded-lg bg-slate-800 px-6 py-2.5 text-slate-200 font-semibold hover:bg-slate-700 transition"
              >
                View Share Card
              </button>
            </div>
          </div>
        )}

        {showShare && (
          <ShareCard summary={completedWalk} onClose={handleCloseShare} />
        )}
      </main>
    </div>
  );
}
