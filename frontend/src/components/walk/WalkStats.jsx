import { formatDistance, formatDuration } from '../../utils/formatters';

export default function WalkStats({ distance, duration, label = 'Live' }) {
  return (
    <div className="flex gap-6 text-lg font-medium text-gray-800">
      <span>{label}: {formatDuration(duration)}</span>
      <span>{formatDistance(distance)}</span>
    </div>
  );
}
