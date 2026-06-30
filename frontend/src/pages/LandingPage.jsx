import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Turn every walk into a strategy game
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Track your routes with GPS, visualize paths on a map, and compete on distance leaderboards.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/register"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-blue-600 px-6 py-3 text-blue-600 font-semibold hover:bg-blue-50"
          >
            Log In
          </Link>
        </div>
        <ul className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          <li className="rounded-lg bg-white p-6 shadow">
            <h2 className="font-semibold text-gray-900">GPS Tracking</h2>
            <p className="mt-2 text-gray-600">Record walks in real time from your browser.</p>
          </li>
          <li className="rounded-lg bg-white p-6 shadow">
            <h2 className="font-semibold text-gray-900">Route Maps</h2>
            <p className="mt-2 text-gray-600">See every route on interactive OpenStreetMap tiles.</p>
          </li>
          <li className="rounded-lg bg-white p-6 shadow">
            <h2 className="font-semibold text-gray-900">Leaderboards</h2>
            <p className="mt-2 text-gray-600">Compete with others on total distance walked.</p>
          </li>
        </ul>
      </main>
    </div>
  );
}
