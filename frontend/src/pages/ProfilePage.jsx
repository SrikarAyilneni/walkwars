import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { userApi } from '../api/userApi';
import { formatDistance, formatDuration } from '../utils/formatters';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.profile()
      .then((res) => setProfile(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="p-8 text-center text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Username</p>
          <p className="text-xl font-semibold">{profile?.username}</p>
          <p className="mt-4 text-sm text-gray-500">Member since</p>
          <p>{new Date(profile?.memberSince).toLocaleDateString()}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Total Distance</p>
            <p className="text-xl font-bold text-blue-600">
              {formatDistance(profile?.stats?.totalDistanceMeters)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Total Time</p>
            <p className="text-xl font-bold text-blue-600">
              {formatDuration(profile?.stats?.totalDurationSeconds)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Walks</p>
            <p className="text-xl font-bold text-blue-600">{profile?.stats?.walkCount ?? 0}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
