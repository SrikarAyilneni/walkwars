import { Polyline } from 'react-leaflet';

export default function RoutePolyline({ positions, color = '#2563eb' }) {
  if (!positions?.length) return null;
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color, weight: 4 }}
    />
  );
}
