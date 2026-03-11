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
  geoStatus: "idle" | "acquiring" | "active" | "fallback";
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
    geoStatus: "idle",
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trailRef = useRef<Position[]>([]);
  const distanceRef = useRef(0);
  const gotFixRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyPosition = useCallback((pos: GeolocationPosition) => {
    gotFixRef.current = true;

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
    if (prev) {
      const d = haversineDistance(prev.lat, prev.lng, newPos.lat, newPos.lng);
      // Accept larger accuracy on desktop (WiFi-based can be 50-100m)
      if (d > 2 && d < 500 && newPos.accuracy < 200) {
        distanceRef.current += d;
      }
    }

    // Only add to trail if moved enough (wider threshold for low-accuracy fixes)
    const minMove = newPos.accuracy > 50 ? 10 : 3;
    if (!prev || haversineDistance(prev.lat, prev.lng, newPos.lat, newPos.lng) > minMove) {
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
      geoStatus: "active",
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }

    startTimeRef.current = Date.now();
    trailRef.current = [];
    distanceRef.current = 0;
    gotFixRef.current = false;

    setState((s) => ({ ...s, isTracking: true, error: null, geoStatus: "acquiring" }));

    // Duration timer
    durationTimerRef.current = setInterval(() => {
      setState((s) => ({
        ...s,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);

    // Try high accuracy first
    watchIdRef.current = navigator.geolocation.watchPosition(
      applyPosition,
      () => {
        // High-accuracy failed — fall back to low accuracy
        if (!gotFixRef.current) {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
          watchIdRef.current = navigator.geolocation.watchPosition(
            applyPosition,
            (err) => {
              // Both modes failed — use IP-based fallback
              setState((s) => ({
                ...s,
                error: null,
                geoStatus: "fallback",
              }));
              fetchIPLocation();
            },
            {
              enableHighAccuracy: false,
              maximumAge: 60000,
              timeout: 30000,
            }
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    // Safety net: if no fix after 8 seconds, try IP-based fallback
    // so the music starts regardless
    fallbackTimerRef.current = setTimeout(() => {
      if (!gotFixRef.current) {
        fetchIPLocation();
      }
    }, 8000);
  }, [applyPosition]);

  // IP-based geolocation fallback (very rough but gets the city right)
  const fetchIPLocation = useCallback(async () => {
    try {
      // Use a free IP geolocation service
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error("IP lookup failed");
      const data = await res.json();

      if (data.latitude && data.longitude) {
        const fallbackPos: Position = {
          lat: data.latitude,
          lng: data.longitude,
          speed: 0,
          heading: 0,
          accuracy: 5000, // city-level accuracy
          timestamp: Date.now(),
        };

        trailRef.current.push(fallbackPos);

        setState((s) => ({
          ...s,
          currentPosition: fallbackPos,
          trail: [...trailRef.current],
          isTracking: true,
          error: null,
          geoStatus: "fallback",
        }));
      }
    } catch {
      // Last resort: use a default position so the app still works
      const defaultPos: Position = {
        lat: 34.0522,
        lng: -118.2437, // Los Angeles
        speed: 0,
        heading: 0,
        accuracy: 10000,
        timestamp: Date.now(),
      };

      trailRef.current.push(defaultPos);

      setState((s) => ({
        ...s,
        currentPosition: defaultPos,
        trail: [...trailRef.current],
        isTracking: true,
        error: null,
        geoStatus: "fallback",
      }));
    }
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
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    gotFixRef.current = false;
    setState((s) => ({ ...s, isTracking: false, geoStatus: "idle" }));
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
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
