"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface Position {
  lat: number;
  lng: number;
  speed: number; // m/s
  heading: number; // degrees
  accuracy: number;
  timestamp: number;
}

export interface GeoState {
  currentPosition: Position | null;
  trail: Position[];
  isTracking: boolean;
  distance: number; // meters
  duration: number; // seconds
  avgSpeed: number; // m/s
  error: string | null;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    currentPosition: null,
    trail: [],
    isTracking: false,
    distance: 0,
    duration: 0,
    avgSpeed: 0,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trailRef = useRef<Position[]>([]);
  const distanceRef = useRef(0);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }

    startTimeRef.current = Date.now();
    trailRef.current = [];
    distanceRef.current = 0;

    // Duration timer
    durationTimerRef.current = setInterval(() => {
      setState((s) => ({
        ...s,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: Position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ?? 0,
          heading: pos.coords.heading ?? 0,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };

        // Calculate distance from last position
        const prev = trailRef.current[trailRef.current.length - 1];
        if (prev && newPos.accuracy < 30) {
          const d = haversineDistance(prev.lat, prev.lng, newPos.lat, newPos.lng);
          if (d > 2 && d < 100) {
            distanceRef.current += d;
          }
        }

        // Only add to trail if moved enough (avoid GPS jitter)
        if (!prev || haversineDistance(prev.lat, prev.lng, newPos.lat, newPos.lng) > 3) {
          trailRef.current.push(newPos);
        }

        const elapsed = (Date.now() - startTimeRef.current) / 1000;

        setState((s) => ({
          ...s,
          currentPosition: newPos,
          trail: [...trailRef.current],
          distance: distanceRef.current,
          avgSpeed: elapsed > 0 ? distanceRef.current / elapsed : 0,
          isTracking: true,
          error: null,
        }));
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    setState((s) => ({ ...s, isTracking: true, error: null }));
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    setState((s) => ({ ...s, isTracking: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
