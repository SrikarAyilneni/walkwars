import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { userApi } from '../api/userApi';
import { walkApi } from '../api/walkApi';
import { formatDistance, formatDuration, formatDate } from '../utils/formatters';

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [recentWalks, setRecentWalks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, walksRes] = await Promise.all([
          userApi.profile(),
          walkApi.list(0, 5),
        ]);
        setProfile(profileRes.data.data);
        setRecentWalks(walksRes.data.data.content || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="p-8 text-center text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const stats = profile?.stats;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Total Distance</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatDistance(stats?.totalDistanceMeters)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Total Time</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatDuration(stats?.totalDurationSeconds)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Walks</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.walkCount ?? 0}</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Walks</h2>
            <Link to="/walks" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {recentWalks.length === 0 ? (
            <p className="mt-4 text-gray-500">No walks yet. <Link to="/walk" className="text-blue-600">Start your first walk!</Link></p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2">Date</th>
                  <th className="py-2">Distance</th>
                  <th className="py-2">Duration</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {recentWalks.map((walk) => (
                  <tr key={walk.id} className="border-b">
                    <td className="py-2">{formatDate(walk.startTime)}</td>
                    <td className="py-2">{formatDistance(walk.distanceMeters)}</td>
                    <td className="py-2">{formatDuration(walk.durationSeconds)}</td>
                    <td className="py-2">
                      <Link to={`/walks/${walk.id}`} className="text-blue-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
