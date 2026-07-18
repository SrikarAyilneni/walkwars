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
  
  const [pendingWalk, setPendingWalk] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

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

    // Check for pending local walks recorded as guest
    const saved = localStorage.getItem('pending_walk');
    if (saved) {
      try {
        setPendingWalk(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSyncPending = async () => {
    if (!pendingWalk) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await walkApi.import({
        clientStartedAt: pendingWalk.clientStartedAt,
        clientEndedAt: pendingWalk.clientEndedAt,
        points: pendingWalk.points,
      });
      localStorage.removeItem('pending_walk');
      setPendingWalk(null);
      
      // Reload stats & walks
      setLoading(true);
      const [profileRes, walksRes] = await Promise.all([
        userApi.profile(),
        walkApi.list(0, 5),
      ]);
      setProfile(profileRes.data.data);
      setRecentWalks(walksRes.data.data.content || []);
    } catch (err) {
      setSyncError(err.response?.data?.message || 'Failed to sync walk to server');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  const handleDiscardPending = () => {
    if (window.confirm('Discard this local walk?')) {
      localStorage.removeItem('pending_walk');
      setPendingWalk(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <p className="p-8 text-center text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  const stats = profile?.stats;

  const getTodayTotals = () => {
    const todayStr = new Date().toDateString();
    let steps = 0;
    let calories = 0;

    recentWalks.forEach(w => {
      if (new Date(w.startTime).toDateString() === todayStr) {
        steps += Math.round(w.distanceMeters / 0.75);
        calories += (w.caloriesBurnt || 0);
      }
    });

    return { steps, calories };
  };

  const todayTotals = getTodayTotals();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        
        {/* Dashboard Welcome Header with Streak */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Welcome back, {profile?.username || 'Walker'}!</p>
          </div>
          {profile?.streakCount !== undefined && profile.streakCount > 0 ? (
            <div className="flex items-center gap-2 self-start bg-orange-500/10 border border-orange-500/25 text-orange-500 font-extrabold px-4 py-2.5 rounded-full text-sm animate-pulse shadow-lg shadow-orange-500/5">
              <span>🔥</span>
              <span>{profile.streakCount} Day Streak</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 self-start bg-slate-800 border border-slate-700 text-slate-400 font-bold px-4 py-2.5 rounded-full text-sm">
              <span>❄️</span>
              <span>No Active Streak</span>
            </div>
          )}
        </div>

        {pendingWalk && (
          <div className="mt-4 rounded-xl bg-orange-500/10 border border-orange-500/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Pending Walk Detected</h2>
              <p className="text-sm text-slate-400 mt-1">
                You have a walk of **{(pendingWalk.distanceMeters / 1000).toFixed(2)} km** recorded while logged out. Save it to your profile now!
              </p>
              {syncError && <p className="text-xs text-red-400 mt-2">{syncError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDiscardPending}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 text-sm font-semibold transition"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSyncPending}
                disabled={syncing}
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 text-sm font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 transition"
              >
                {syncing ? 'Syncing...' : 'Save to Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Daily Goals Progress section */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Steps Goal Progress */}
          <div className="rounded-2xl bg-slate-900 p-6 border border-slate-850 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Today's Steps Goal</p>
                <p className="text-2xl font-black text-white mt-1">
                  {todayTotals.steps.toLocaleString()} <span className="text-sm font-medium text-slate-400">/ {(profile?.dailyStepGoal || 10000).toLocaleString()} steps</span>
                </p>
              </div>
              {todayTotals.steps >= (profile?.dailyStepGoal || 10000) ? (
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-extrabold px-2.5 py-1 rounded-full animate-bounce">
                  🎉 HITTED!
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500">
                  {Math.round((todayTotals.steps / (profile?.dailyStepGoal || 10000)) * 100)}% done
                </span>
              )}
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 mt-4 border border-slate-800 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (todayTotals.steps / (profile?.dailyStepGoal || 10000)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Calories Goal Progress */}
          <div className="rounded-2xl bg-slate-900 p-6 border border-slate-850 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Today's Calorie Goal</p>
                <p className="text-2xl font-black text-white mt-1">
                  {todayTotals.calories} <span className="text-sm font-medium text-slate-400">/ {profile?.dailyCalorieGoal || 300} kcal</span>
                </p>
              </div>
              {todayTotals.calories >= (profile?.dailyCalorieGoal || 300) ? (
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-extrabold px-2.5 py-1 rounded-full animate-bounce">
                  🔥 BURNED!
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500">
                  {Math.round((todayTotals.calories / (profile?.dailyCalorieGoal || 300)) * 100)}% done
                </span>
              )}
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 mt-4 border border-slate-800 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (todayTotals.calories / (profile?.dailyCalorieGoal || 300)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-900 p-6 border border-slate-850">
            <p className="text-sm text-slate-450">Total Distance</p>
            <p className="text-2xl font-black text-orange-500 mt-1">
              {formatDistance(stats?.totalDistanceMeters)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900 p-6 border border-slate-850">
            <p className="text-sm text-slate-455">Total Time</p>
            <p className="text-2xl font-black text-orange-500 mt-1">
              {formatDuration(stats?.totalDurationSeconds)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900 p-6 border border-slate-850">
            <p className="text-sm text-slate-455">Total Steps</p>
            <p className="text-2xl font-black text-orange-500 mt-1">
              {Math.round((stats?.totalDistanceMeters || 0) / 0.75).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900 p-6 border border-slate-850">
            <p className="text-sm text-slate-455">Walks</p>
            <p className="text-2xl font-black text-orange-500 mt-1">{stats?.walkCount ?? 0}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-slate-900 p-6 border border-slate-850">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Walks</h2>
            <Link to="/walks" className="text-sm text-orange-500 hover:underline">View all</Link>
          </div>
          {recentWalks.length === 0 ? (
            <p className="mt-4 text-slate-400">No walks yet. <Link to="/" className="text-orange-500 hover:underline">Start your first walk!</Link></p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-450">
                  <th className="py-2">Date</th>
                  <th className="py-2">Distance</th>
                  <th className="py-2">Duration</th>
                  <th className="py-2">Calories</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {recentWalks.map((walk) => (
                  <tr key={walk.id} className="border-b border-slate-800/50 hover:bg-slate-900/60">
                    <td className="py-2 text-slate-300">{formatDate(walk.startTime)}</td>
                    <td className="py-2 font-semibold text-white">{formatDistance(walk.distanceMeters)}</td>
                    <td className="py-2 text-slate-350">{formatDuration(walk.durationSeconds)}</td>
                    <td className="py-2 text-slate-350">{walk.caloriesBurnt ?? 0} kcal</td>
                    <td className="py-2 text-right">
                      <Link to={`/walks/${walk.id}`} className="text-orange-500 hover:underline">View</Link>
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
