import { formatDistance, formatDuration } from '../../utils/formatters';

export default function WalkStats({ distance, duration, label = 'Live' }) {
  const isLive = label === 'Live';

  return (
    <div className="flex flex-wrap items-center gap-6 text-lg font-bold">
      {/* Live Timer Stat */}
      <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800/60 shadow-inner">
        {isLive && (
          <span className="relative flex h-2.5 w-2.5 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
        <span className={isLive ? 'text-red-500 tracking-wide uppercase text-xs font-black' : 'text-slate-400 tracking-wide uppercase text-xs font-black'}>
          {label}
        </span>
        <span className="font-mono text-white text-base">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Distance Stat */}
      <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800/60 shadow-inner">
        <span className="text-orange-500 tracking-wide uppercase text-xs font-black">
          Distance
        </span>
        <span className="font-mono text-white text-base">
          {formatDistance(distance)}
        </span>
      </div>

      {/* Steps Stat */}
      <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800/60 shadow-inner">
        <span className="text-orange-500 tracking-wide uppercase text-xs font-black">
          Steps
        </span>
        <span className="font-mono text-white text-base">
          {Math.round(distance / 0.75).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
