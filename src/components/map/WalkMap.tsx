"use client";

import { useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Position } from "@/hooks/useGeolocation";

interface Props {
  currentPosition: Position | null;
  trail: Position[];
  isTracking: boolean;
}

export default function WalkMap({ currentPosition, trail, isTracking }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const initializedRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          },
        },
        layers: [
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      center: [-73.985, 40.748], // Default: NYC
      zoom: 15,
      pitch: 45,
      bearing: -17.6,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Trail line source
      map.addSource("trail", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      });

      // Trail glow (wider, transparent)
      map.addLayer({
        id: "trail-glow",
        type: "line",
        source: "trail",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#6366f1",
          "line-width": 8,
          "line-opacity": 0.2,
          "line-blur": 4,
        },
      });

      // Trail line
      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#818cf8",
          "line-width": 3,
          "line-opacity": 0.9,
        },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      initializedRef.current = false;
    };
  }, []);

  // Update marker and trail
  const updateMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !currentPosition) return;

    const { lat, lng } = currentPosition;

    // Update or create marker
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "location-pulse";
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      // Fly to user's actual position on first fix
      map.flyTo({ center: [lng, lat], zoom: 16, duration: 2000 });
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }

    // Update trail
    if (trail.length > 1 && map.getSource("trail")) {
      const coords = trail.map((p) => [p.lng, p.lat]);
      (map.getSource("trail") as maplibregl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      });
    }

    // Keep map centered while tracking
    if (isTracking) {
      map.easeTo({ center: [lng, lat], duration: 1000 });
    }
  }, [currentPosition, trail, isTracking]);

  useEffect(() => {
    updateMap();
  }, [updateMap]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ background: "#0a0a1a" }}
    />
  );
}
