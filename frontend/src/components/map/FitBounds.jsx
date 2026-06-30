import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions?.length >= 2) {
      map.fitBounds(positions, { padding: [24, 24] });
    } else if (positions?.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions, map]);

  return null;
}
