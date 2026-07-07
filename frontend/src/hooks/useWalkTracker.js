import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { walkApi } from '../api/walkApi';
import { haversineMeters, haversineTotal } from '../utils/haversine';

// 1-second silent WAV audio data URI to keep the JS thread alive in the background
const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

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
  const audioRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Initialize the silent audio object on mount
  useEffect(() => {
    audioRef.current = new Audio(SILENT_AUDIO);
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  const startBackgroundServices = async () => {
    // 1. Play silent audio (keeps background process alive on screen lock)
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        console.log('Background audio tracking started');
      } catch (err) {
        console.warn('Audio play failed (waiting for user interaction):', err);
      }
    }

    // 2. Request Screen Wake Lock (stops screen from locking automatically)
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Screen Wake Lock acquired');
      } catch (err) {
        console.warn('Failed to acquire Screen Wake Lock:', err);
      }
    }
  };

  const stopBackgroundServices = async () => {
    // 1. Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 2. Release Screen Wake Lock
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Screen Wake Lock released');
      } catch (err) {
        console.error('Failed to release Wake Lock:', err);
      }
    }
  };

  // Automatically manage background services on status updates
  useEffect(() => {
    if (status === 'active') {
      startBackgroundServices();
    } else if (status === 'idle') {
      stopBackgroundServices();
    }
  }, [status]);

  // Re-acquire Wake Lock when the tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (status === 'active' && document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Screen Wake Lock re-acquired on visibility change');
        } catch (err) {
          console.warn('Failed to re-acquire Wake Lock:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);

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

  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const stateRef = useRef({ sequence, isAuthenticated, positions, walkId });
  useEffect(() => {
    stateRef.current = { sequence, isAuthenticated, positions, walkId };
  }, [sequence, isAuthenticated, positions, walkId]);

  useEffect(() => {
    if (status !== 'active') return undefined;

    const interval = setInterval(async () => {
      const currentPos = positionRef.current;
      if (!currentPos) return;

      const lat = currentPos.coords.latitude;
      const lng = currentPos.coords.longitude;
      const accuracy = currentPos.coords.accuracy;

      const {
        sequence: currentSeq,
        isAuthenticated: auth,
        positions: currentPosList,
        walkId: currentWalkId,
      } = stateRef.current;

      if (lastSentRef.current) {
        const dist = haversineMeters(
          lastSentRef.current.lat,
          lastSentRef.current.lng,
          lat,
          lng,
        );
        // Record if user moves at least 1 meter (reduces GPS jitter cutoff from 5m to 1m)
        if (dist < 1) return;
      }

      const nextSeq = currentSeq + 1;
      const pointTimestamp = new Date().toISOString();

      if (auth) {
        try {
          await walkApi.addPoint({
            walkId: currentWalkId,
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
        const newPositions = [...currentPosList, [lat, lng]];
        setPositions(newPositions);

        localStorage.setItem('active_local_walk', JSON.stringify({
          id: currentWalkId,
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
  }, [status]);

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
