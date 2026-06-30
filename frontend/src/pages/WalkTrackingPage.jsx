import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WalkMap from '../components/map/WalkMap';
import RoutePolyline from '../components/map/RoutePolyline';
import FitBounds from '../components/map/FitBounds';
import WalkStats from '../components/walk/WalkStats';
import WalkControls from '../components/walk/WalkControls';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWalkTracker } from '../hooks/useWalkTracker';

export default function WalkTrackingPage() {
  const navigate = useNavigate();
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

  const mapCenter = positions.length > 0
    ? positions[positions.length - 1]
    : position
      ? [position.coords.latitude, position.coords.longitude]
      : [12.9716, 77.5946];

  const handleStart = async () => {
    try {
      await startWalk();
    } catch {
      // error shown via error state
    }
  };

  const handleStop = async () => {
    if (!window.confirm('End this walk?')) return;
    try {
      const summary = await endWalk();
      if (summary?.territoryCreated) {
        alert('Territory claimed! You completed a closed-loop walk.');
      }
      navigate(`/walks/${summary.id}`);
    } catch {
      // error shown via error state
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Track Walk</h1>

        {(error || geoError) && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700" role="alert">
            {error || geoError}
            {geoError && (
              <p className="mt-2 text-sm">Enable location permissions in your browser settings to track walks.</p>
            )}
          </div>
        )}

        <div className="mt-4 h-[60vh] w-full overflow-hidden rounded-lg shadow">
          <WalkMap center={mapCenter} zoom={15}>
            <RoutePolyline positions={positions} />
            <FitBounds positions={positions} />
          </WalkMap>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
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
          <p className="mt-2 text-center text-sm text-gray-500">
            Distance shown is a live estimate. Final distance is calculated server-side when you stop.
          </p>
        )}
      </main>
    </div>
  );
}
