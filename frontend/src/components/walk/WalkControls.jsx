export default function WalkControls({ status, onStart, onStop, disabled }) {
  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="rounded-lg bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
        aria-label="Start walk"
      >
        Start Walk
      </button>
    );
  }

  if (status === 'active' || status === 'completing') {
    return (
      <button
        type="button"
        onClick={onStop}
        disabled={status === 'completing'}
        className="rounded-lg bg-red-600 px-6 py-3 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
        aria-label="Stop walk"
      >
        {status === 'completing' ? 'Saving...' : 'Stop Walk'}
      </button>
    );
  }

  return null;
}
