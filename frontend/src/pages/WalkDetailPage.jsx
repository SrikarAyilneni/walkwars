import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WalkMap from '../components/map/WalkMap';
import RoutePolyline from '../components/map/RoutePolyline';
import FitBounds from '../components/map/FitBounds';
import ShareCard from '../components/walk/ShareCard';
import { walkApi } from '../api/walkApi';
import { formatDistance, formatDuration, formatDate, geoJsonToLeafletPositions } from '../utils/formatters';

export default function WalkDetailPage() {
  const { id } = useParams();
  const [walk, setWalk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await walkApi.get(id);
        setWalk(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load walk');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <p className="p-8 text-center text-slate-400">Loading walk...</p>
      </div>
    );
  }

  if (error || !walk) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <p className="p-8 text-center text-red-400">{error || 'Walk not found'}</p>
        <Link to="/walks" className="block text-center text-orange-500 hover:underline">Back to history</Link>
      </div>
    );
  }

  const positions = geoJsonToLeafletPositions(walk.pathGeoJson);
  const center = positions.length > 0 ? positions[0] : [12.9716, 77.5946];

  // Dynamically check if the walk path represents a completed closed-loop territory claim
  const isClosedLoop = positions.length >= 4 && (
    Math.abs(positions[0][0] - positions[positions.length - 1][0]) < 0.0001 &&
    Math.abs(positions[0][1] - positions[positions.length - 1][1]) < 0.0001
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/walks" className="text-sm text-slate-400 hover:text-white transition">← Back to history</Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Walk Details</h1>
          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 text-sm font-bold shadow-lg shadow-orange-600/20 transition"
          >
            Share Walk Card
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-850">
            <p className="text-sm text-slate-450">Date</p>
            <p className="font-semibold text-white mt-1">{formatDate(walk.startTime)}</p>
          </div>
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-850">
            <p className="text-sm text-slate-450">Distance</p>
            <p className="font-semibold text-white mt-1">{formatDistance(walk.distanceMeters)}</p>
          </div>
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-850">
            <p className="text-sm text-slate-450">Duration</p>
            <p className="font-semibold text-white mt-1">{formatDuration(walk.durationSeconds)}</p>
          </div>
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-850">
            <p className="text-sm text-slate-450">Steps</p>
            <p className="font-semibold text-white mt-1">
              {Math.round(walk.distanceMeters / 0.75).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 h-[60vh] overflow-hidden rounded-xl border border-slate-800 shadow-lg" aria-label="Route map">
          <WalkMap center={center} zoom={15}>
            <RoutePolyline positions={positions} />
            <FitBounds positions={positions} />
          </WalkMap>
        </div>
        <p className="mt-2 text-sm text-slate-500" role="note">
          Route: {formatDistance(walk.distanceMeters)} over {formatDuration(walk.durationSeconds)}
        </p>

        {showShare && (
          <ShareCard
            summary={{
              distanceMeters: walk.distanceMeters,
              durationSeconds: walk.durationSeconds,
              positions: positions,
              territoryCreated: isClosedLoop
            }}
            onClose={() => setShowShare(false)}
          />
        )}
      </main>
    </div>
  );
}
