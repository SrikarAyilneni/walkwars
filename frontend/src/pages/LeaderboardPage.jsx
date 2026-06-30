import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { leaderboardApi } from '../api/leaderboardApi';
import { useAuth } from '../context/AuthContext';
import { formatDistance } from '../utils/formatters';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await leaderboardApi.get(page, 50);
        setData(res.data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  const totalPages = data ? Math.ceil(data.totalElements / data.size) : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="mt-1 text-gray-600">Ranked by total distance walked</p>

        {data?.currentUserRank && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-blue-800">
            Your rank: #{data.currentUserRank.rank} — {formatDistance(data.currentUserRank.totalDistanceMeters)}
          </div>
        )}

        {loading ? (
          <p className="mt-4 text-gray-600">Loading...</p>
        ) : (
          <table className="mt-6 w-full rounded-lg bg-white shadow text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Walks</th>
              </tr>
            </thead>
            <tbody>
              {(data?.content || []).map((entry) => (
                <tr
                  key={entry.userId}
                  className={`border-b ${entry.userId === user?.id ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">#{entry.rank}</td>
                  <td className="px-4 py-3">{entry.username}</td>
                  <td className="px-4 py-3">{formatDistance(entry.totalDistanceMeters)}</td>
                  <td className="px-4 py-3">{entry.walkCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex gap-2 justify-center">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">Page {page + 1} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
