import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { walkApi } from '../api/walkApi';
import { formatDistance, formatDuration, formatDate } from '../utils/formatters';

export default function WalkHistoryPage() {
  const [walks, setWalks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await walkApi.list(page, 20);
        const data = res.data.data;
        setWalks(data.content || []);
        setTotalPages(data.totalPages || 0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Walk History</h1>

        {loading ? (
          <p className="mt-4 text-gray-600">Loading...</p>
        ) : walks.length === 0 ? (
          <p className="mt-4 text-gray-500">No walks recorded yet.</p>
        ) : (
          <table className="mt-6 w-full rounded-lg bg-white shadow text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {walks.map((walk) => (
                <tr key={walk.id} className="border-b">
                  <td className="px-4 py-3">{formatDate(walk.startTime)}</td>
                  <td className="px-4 py-3">{formatDistance(walk.distanceMeters)}</td>
                  <td className="px-4 py-3">{formatDuration(walk.durationSeconds)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/walks/${walk.id}`} className="text-blue-600 hover:underline">View</Link>
                  </td>
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
