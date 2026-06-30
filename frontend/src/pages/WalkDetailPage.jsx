import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WalkMap from '../components/map/WalkMap';
import RoutePolyline from '../components/map/RoutePolyline';
import FitBounds from '../components/map/FitBounds';
import { walkApi } from '../api/walkApi';
import { formatDistance, formatDuration, formatDate, geoJsonToLeafletPositions } from '../utils/formatters';

export default function WalkDetailPage() {
  const { id } = useParams();
  const [walk, setWalk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="min-h-screen">
        <Navbar />
        <p className="p-8 text-center text-gray-600">Loading walk...</p>
      </div>
    );
  }

  if (error || !walk) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="p-8 text-center text-red-600">{error || 'Walk not found'}</p>
        <Link to="/walks" className="block text-center text-blue-600">Back to history</Link>
      </div>
    );
  }

  const positions = geoJsonToLeafletPositions(walk.pathGeoJson);
  const center = positions.length > 0 ? positions[0] : [12.9716, 77.5946];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/walks" className="text-sm text-blue-600 hover:underline">← Back to history</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Walk Details</h1>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-semibold">{formatDate(walk.startTime)}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Distance</p>
            <p className="font-semibold">{formatDistance(walk.distanceMeters)}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-semibold">{formatDuration(walk.durationSeconds)}</p>
          </div>
        </div>

        <div className="mt-6 h-[60vh] overflow-hidden rounded-lg shadow" aria-label="Route map">
          <WalkMap center={center} zoom={15}>
            <RoutePolyline positions={positions} />
            <FitBounds positions={positions} />
          </WalkMap>
        </div>
        <p className="mt-2 text-sm text-gray-500" role="note">
          Route: {formatDistance(walk.distanceMeters)} over {formatDuration(walk.durationSeconds)}
        </p>
      </main>
    </div>
  );
}
