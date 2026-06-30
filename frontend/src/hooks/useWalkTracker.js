import { useEffect, useRef, useState } from 'react';
import { walkApi } from '../api/walkApi';
import { haversineMeters, haversineTotal } from '../utils/haversine';

export function useWalkTracker(position, geoError) {
  const [walkId, setWalkId] = useState(null);
  const [positions, setPositions] = useState([]);
  const [sequence, setSequence] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(null);
  const lastSentRef = useRef(null);

  useEffect(() => {
    if (status !== 'active' || !startTimeRef.current) return undefined;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== 'active' || !position || !walkId) return undefined;

    const interval = setInterval(async () => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (lastSentRef.current) {
        const dist = haversineMeters(
          lastSentRef.current.lat,
          lastSentRef.current.lng,
          lat,
          lng,
        );
        if (dist < 5) return;
      }

      try {
        const nextSeq = sequence + 1;
        await walkApi.addPoint({
          walkId,
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
          sequenceNumber: nextSeq,
          accuracyMeters: position.coords.accuracy,
        });
        setSequence(nextSeq);
        lastSentRef.current = { lat, lng };
        setPositions((prev) => [...prev, [lat, lng]]);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to record point');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, position, walkId, sequence]);

  async function startWalk() {
    setError(null);
    try {
      const res = await walkApi.start();
      const data = res.data.data;
      setWalkId(data.id);
      setSequence(0);
      setPositions([]);
      lastSentRef.current = null;
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      setStatus('active');

      if (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        await walkApi.addPoint({
          walkId: data.id,
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
          sequenceNumber: 1,
          accuracyMeters: position.coords.accuracy,
        });
        setSequence(1);
        lastSentRef.current = { lat, lng };
        setPositions([[lat, lng]]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start walk');
      throw err;
    }
  }

  async function endWalk() {
    setStatus('completing');
    setError(null);
    try {
      const res = await walkApi.end({
        walkId,
        clientEndedAt: new Date().toISOString(),
      });
      setStatus('idle');
      setWalkId(null);
      startTimeRef.current = null;
      return res.data.data;
    } catch (err) {
      setStatus('active');
      setError(err.response?.data?.message || 'Failed to end walk');
      throw err;
    }
  }

  return {
    status,
    walkId,
    positions,
    error: error || geoError,
    elapsedSeconds,
    liveDistance: haversineTotal(positions),
    startWalk,
    endWalk,
  };
}
