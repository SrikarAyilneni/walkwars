import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { walkApi } from '../api/walkApi';
import { haversineMeters, haversineTotal } from '../utils/haversine';

export function useWalkTracker(position, geoError) {
  const { isAuthenticated } = useAuth();
  const [walkId, setWalkId] = useState(null);
  const [positions, setPositions] = useState([]);
  const [sequence, setSequence] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(null);
  const lastSentRef = useRef(null);

  // Restore active local walk on mount for guests
  useEffect(() => {
    if (!isAuthenticated) {
      const savedActiveWalk = localStorage.getItem('active_local_walk');
      if (savedActiveWalk) {
        try {
          const walk = JSON.parse(savedActiveWalk);
          setWalkId(walk.id);
          setPositions(walk.positions);
          setSequence(walk.sequence);
          startTimeRef.current = walk.startTime;
          setStatus('active');
          if (walk.positions.length > 0) {
            const last = walk.positions[walk.positions.length - 1];
            lastSentRef.current = { lat: last[0], lng: last[1] };
          }
        } catch {
          // ignore corrupt storage
        }
      }
    }
  }, [isAuthenticated]);

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
      const accuracy = position.coords.accuracy;

      if (lastSentRef.current) {
        const dist = haversineMeters(
          lastSentRef.current.lat,
          lastSentRef.current.lng,
          lat,
          lng,
        );
        if (dist < 5) return;
      }

      const nextSeq = sequence + 1;
      const pointTimestamp = new Date().toISOString();

      if (isAuthenticated) {
        try {
          await walkApi.addPoint({
            walkId,
            latitude: lat,
            longitude: lng,
            timestamp: pointTimestamp,
            sequenceNumber: nextSeq,
            accuracyMeters: accuracy,
          });
          setSequence(nextSeq);
          lastSentRef.current = { lat, lng };
          setPositions((prev) => [...prev, [lat, lng]]);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to record point');
        }
      } else {
        // Guest mode local recording
        setSequence(nextSeq);
        lastSentRef.current = { lat, lng };
        const newPositions = [...positions, [lat, lng]];
        setPositions(newPositions);

        localStorage.setItem('active_local_walk', JSON.stringify({
          id: walkId,
          startTime: startTimeRef.current,
          sequence: nextSeq,
          positions: newPositions,
        }));

        const savedPoints = JSON.parse(localStorage.getItem('active_local_walk_points') || '[]');
        savedPoints.push({
          latitude: lat,
          longitude: lng,
          timestamp: pointTimestamp,
          sequenceNumber: nextSeq,
          accuracyMeters: accuracy,
        });
        localStorage.setItem('active_local_walk_points', JSON.stringify(savedPoints));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, position, walkId, sequence, isAuthenticated, positions]);

  async function startWalk() {
    setError(null);
    const clientStartedAt = new Date().toISOString();

    if (isAuthenticated) {
      try {
        const res = await walkApi.start({ clientStartedAt });
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
            timestamp: clientStartedAt,
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
    } else {
      // Guest mode start
      const mockId = `local-${Date.now()}`;
      setWalkId(mockId);
      setSequence(0);
      setPositions([]);
      lastSentRef.current = null;
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      setStatus('active');

      localStorage.removeItem('active_local_walk');
      localStorage.removeItem('active_local_walk_points');

      if (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSequence(1);
        lastSentRef.current = { lat, lng };
        const initialPositions = [[lat, lng]];
        setPositions(initialPositions);

        localStorage.setItem('active_local_walk', JSON.stringify({
          id: mockId,
          startTime: startTimeRef.current,
          sequence: 1,
          positions: initialPositions,
        }));

        localStorage.setItem('active_local_walk_points', JSON.stringify([{
          latitude: lat,
          longitude: lng,
          timestamp: clientStartedAt,
          sequenceNumber: 1,
          accuracyMeters: position.coords.accuracy,
        }]));
      }
    }
  }

  async function endWalk() {
    setStatus('completing');
    setError(null);
    const clientEndedAt = new Date().toISOString();

    if (isAuthenticated) {
      try {
        const res = await walkApi.end({
          walkId,
          clientEndedAt,
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
    } else {
      // Guest mode end
      const points = JSON.parse(localStorage.getItem('active_local_walk_points') || '[]');
      if (points.length < 2) {
        setStatus('active');
        const errStr = 'At least 2 points required to complete a walk';
        setError(errStr);
        throw new Error(errStr);
      }

      const totalDist = haversineTotal(positions);
      if (totalDist < 10) {
        setStatus('active');
        const errStr = 'Walk distance must be at least 10 meters';
        setError(errStr);
        throw new Error(errStr);
      }

      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const localSummary = {
        clientStartedAt: new Date(startTimeRef.current).toISOString(),
        clientEndedAt,
        distanceMeters: totalDist,
        durationSeconds: duration,
        pointCount: points.length,
        points,
        positions,
        isGuest: true,
      };

      localStorage.setItem('pending_walk', JSON.stringify(localSummary));

      // Clean active local states
      localStorage.removeItem('active_local_walk');
      localStorage.removeItem('active_local_walk_points');

      setStatus('idle');
      setWalkId(null);
      startTimeRef.current = null;
      return localSummary;
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
