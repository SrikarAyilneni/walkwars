import { useEffect, useState } from 'react';

export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
        ...options,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, error };
}
