import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { formatDistance, formatDuration } from '../utils/formatters';

export default function ProfilePage() {
  const { updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  const [dailyStepGoal, setDailyStepGoal] = useState('10000');
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('300');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    userApi.profile()
      .then((res) => {
        const data = res.data.data;
        setProfile(data);
        setHeightCm(data.heightCm || '');
        setWeightKg(data.weightKg || '');
        setAge(data.age || '');
        setDailyStepGoal(data.dailyStepGoal || '10000');
        setDailyCalorieGoal(data.dailyCalorieGoal || '300');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await userApi.updateProfile({
        heightCm: heightCm ? parseInt(heightCm, 10) : null,
        weightKg: weightKg ? parseInt(weightKg, 10) : null,
        age: age ? parseInt(age, 10) : null,
        dailyStepGoal: dailyStepGoal ? parseInt(dailyStepGoal, 10) : 10000,
        dailyCalorieGoal: dailyCalorieGoal ? parseInt(dailyCalorieGoal, 10) : 300,
      });
      const updatedUser = res.data.data;
      updateCurrentUser(updatedUser);
      setSuccess(true);
      // Update profile local state
      setProfile(prev => ({
        ...prev,
        heightCm: updatedUser.heightCm,
        weightKg: updatedUser.weightKg,
        age: updatedUser.age,
        dailyStepGoal: updatedUser.dailyStepGoal,
        dailyCalorieGoal: updatedUser.dailyCalorieGoal,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <p className="p-8 text-center text-slate-400">Loading profile...</p>
      </div>
    );
  }

  const stats = profile?.stats;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Profile Settings</h1>
            <p className="text-sm text-slate-400 mt-1">
              Member since {new Date(profile?.memberSince).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>
          {profile?.streakCount !== undefined && (
            <div className="flex items-center gap-2 self-start bg-orange-500/10 border border-orange-500/25 text-orange-500 font-extrabold px-4.5 py-2.5 rounded-full text-base shadow-lg shadow-orange-500/5 animate-pulse">
              <span>🔥</span>
              <span>{profile.streakCount} Day Streak</span>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {/* Left Column: Form Settings */}
          <div className="md:col-span-2">
            <form onSubmit={handleSave} className="space-y-6 rounded-2xl bg-slate-900 p-6 border border-slate-850 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4">Fitness Goals & Physical Stats</h2>
              
              {success && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm font-semibold text-green-400">
                  ✓ Profile settings saved successfully!
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm font-semibold text-red-400">
                  ✗ {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="height" className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Height (cm)</label>
                  <input
                    id="height"
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Weight (kg)</label>
                  <input
                    id="weight"
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 70"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="age" className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Age</label>
                  <input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label htmlFor="stepGoal" className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Daily Steps Goal</label>
                  <input
                    id="stepGoal"
                    type="number"
                    required
                    value={dailyStepGoal}
                    onChange={(e) => setDailyStepGoal(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="calorieGoal" className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Daily Calorie Goal (kcal)</label>
                  <input
                    id="calorieGoal"
                    type="number"
                    required
                    value={dailyCalorieGoal}
                    onChange={(e) => setDailyCalorieGoal(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-sm font-bold shadow-lg shadow-orange-600/10 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Statistics Overview */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900 p-6 border border-slate-850 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4">Account Information</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Username</p>
                  <p className="text-base text-white font-semibold mt-1">{profile?.username}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 border border-slate-850 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">All-Time Statistics</h2>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Total Distance</p>
                <p className="text-xl font-black text-orange-500 mt-1">
                  {formatDistance(stats?.totalDistanceMeters)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Total Time</p>
                <p className="text-xl font-black text-orange-500 mt-1">
                  {formatDuration(stats?.totalDurationSeconds)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Walks Completed</p>
                <p className="text-xl font-black text-orange-500 mt-1">
                  {stats?.walkCount ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
