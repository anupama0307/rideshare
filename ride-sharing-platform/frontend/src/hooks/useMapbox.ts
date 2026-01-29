'use client';

import { useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseMapboxOptions {
  container: string | HTMLElement;
  style?: string;
  center?: [number, number];
  zoom?: number;
}

interface RouteOptions {
  coordinates: [number, number][];
  color?: string;
  width?: number;
  id?: string;
}

interface MarkerOptions {
  coordinates: [number, number];
  color?: string;
  popup?: string;
  id: string;
  draggable?: boolean;
  onDragEnd?: (lngLat: { lng: number; lat: number }) => void;
}

export function useMapbox() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  const initializeMap = useCallback((options: UseMapboxOptions) => {
    if (mapRef.current) return mapRef.current;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const map = new mapboxgl.Map({
      container: options.container,
      style: options.style || 'mapbox://styles/mapbox/streets-v12',
      center: options.center || [-74.006, 40.7128], // NYC default
      zoom: options.zoom || 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    map.on('load', () => {
      setIsLoaded(true);
    });

    mapRef.current = map;
    return map;
  }, []);

  const addMarker = useCallback((options: MarkerOptions) => {
    const map = mapRef.current;
    if (!map) return null;

    // Remove existing marker with same ID
    const existingMarker = markersRef.current.get(options.id);
    if (existingMarker) {
      existingMarker.remove();
    }

    const marker = new mapboxgl.Marker({
      color: options.color || '#22c55e',
      draggable: options.draggable || false,
    })
      .setLngLat(options.coordinates)
      .addTo(map);

    if (options.popup) {
      marker.setPopup(new mapboxgl.Popup().setHTML(options.popup));
    }

    if (options.draggable && options.onDragEnd) {
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        options.onDragEnd!({ lng: lngLat.lng, lat: lngLat.lat });
      });
    }

    markersRef.current.set(options.id, marker);
    return marker;
  }, []);

  const removeMarker = useCallback((id: string) => {
    const marker = markersRef.current.get(id);
    if (marker) {
      marker.remove();
      markersRef.current.delete(id);
    }
  }, []);

  const updateMarkerPosition = useCallback((id: string, coordinates: [number, number]) => {
    const marker = markersRef.current.get(id);
    if (marker) {
      marker.setLngLat(coordinates);
    }
  }, []);

  const addRoute = useCallback(async (options: RouteOptions) => {
    const map = mapRef.current;
    if (!map || !isLoaded) return null;

    const routeId = options.id || 'route';
    const sourceId = `${routeId}-source`;
    const layerId = `${routeId}-layer`;

    // Remove existing route if present
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Get route from Mapbox Directions API
    const coordinatesString = options.coordinates
      .map((coord) => coord.join(','))
      .join(';');

    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    );
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error('No route found');
      return null;
    }

    const route = data.routes[0];

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: route.geometry,
      },
    });

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': options.color || '#22c55e',
        'line-width': options.width || 5,
        'line-opacity': 0.8,
      },
    });

    // Fit bounds to show entire route
    const coordinates = route.geometry.coordinates;
    const bounds = coordinates.reduce(
      (bounds: mapboxgl.LngLatBounds, coord: [number, number]) => bounds.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    );

    map.fitBounds(bounds, { padding: 50 });

    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: route.geometry,
    };
  }, [isLoaded]);

  const removeRoute = useCallback((routeId = 'route') => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = `${routeId}-source`;
    const layerId = `${routeId}-layer`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }, []);

  const addHeatmap = useCallback((data: { lat: number; lng: number; intensity: number }[], id = 'heatmap') => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const sourceId = `${id}-source`;
    const layerId = `${id}-layer`;

    // Remove existing heatmap
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    const features = data.map((point) => ({
      type: 'Feature' as const,
      properties: { intensity: point.intensity },
      geometry: {
        type: 'Point' as const,
        coordinates: [point.lng, point.lat],
      },
    }));

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    map.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      paint: {
        'heatmap-weight': ['get', 'intensity'],
        'heatmap-intensity': 1,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)',
        ],
        'heatmap-radius': 30,
        'heatmap-opacity': 0.7,
      },
    });
  }, [isLoaded]);

  const flyTo = useCallback((center: [number, number], zoom?: number) => {
    mapRef.current?.flyTo({
      center,
      zoom: zoom || mapRef.current.getZoom(),
      essential: true,
    });
  }, []);

  const cleanup = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    mapRef.current?.remove();
    mapRef.current = null;
    setIsLoaded(false);
  }, []);

  return {
    map: mapRef.current,
    isLoaded,
    initializeMap,
    addMarker,
    removeMarker,
    updateMarkerPosition,
    addRoute,
    removeRoute,
    addHeatmap,
    flyTo,
    cleanup,
  };
}

// Hook for geocoding
export function useGeocoding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock locations for demo/testing when Mapbox token is not available
  const getMockSuggestions = useCallback((query: string) => {
    const mockLocations = [
      // Bangalore
      { id: '1', placeName: 'MG Road, Bangalore, Karnataka', coordinates: { latitude: 12.9758, longitude: 77.6045 } },
      { id: '2', placeName: 'Koramangala, Bangalore, Karnataka', coordinates: { latitude: 12.9352, longitude: 77.6245 } },
      { id: '3', placeName: 'Whitefield, Bangalore, Karnataka', coordinates: { latitude: 12.9698, longitude: 77.7500 } },
      { id: '4', placeName: 'Electronic City, Bangalore, Karnataka', coordinates: { latitude: 12.8399, longitude: 77.6770 } },
      { id: '5', placeName: 'Indiranagar, Bangalore, Karnataka', coordinates: { latitude: 12.9784, longitude: 77.6408 } },
      // Mumbai
      { id: '6', placeName: 'Bandra, Mumbai, Maharashtra', coordinates: { latitude: 19.0596, longitude: 72.8295 } },
      { id: '7', placeName: 'Andheri, Mumbai, Maharashtra', coordinates: { latitude: 19.1136, longitude: 72.8697 } },
      { id: '8', placeName: 'Marine Drive, Mumbai, Maharashtra', coordinates: { latitude: 18.9432, longitude: 72.8235 } },
      // Delhi
      { id: '9', placeName: 'Connaught Place, Delhi', coordinates: { latitude: 28.6315, longitude: 77.2167 } },
      { id: '10', placeName: 'India Gate, Delhi', coordinates: { latitude: 28.6129, longitude: 77.2295 } },
      { id: '11', placeName: 'Hauz Khas, Delhi', coordinates: { latitude: 28.5494, longitude: 77.2001 } },
      { id: '12', placeName: 'Gurgaon Cyber City, Haryana', coordinates: { latitude: 28.4945, longitude: 77.0890 } },
    ];

    const lowerQuery = query.toLowerCase();

    // Show all locations - matching ones first, then others
    const matching = mockLocations.filter(loc => loc.placeName.toLowerCase().includes(lowerQuery));
    const others = mockLocations.filter(loc => !loc.placeName.toLowerCase().includes(lowerQuery));
    const sorted = [...matching, ...others];

    return sorted.map(loc => ({ ...loc, address: loc.placeName }));
  }, []);

  const geocode = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    // Use OpenStreetMap Nominatim API (free, covers all of India)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=10&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'RideShareApp/1.0'
          }
        }
      );
      const data = await response.json();

      if (!data || data.length === 0) {
        // Fallback to mock if no results
        setIsLoading(false);
        return getMockSuggestions(query);
      }

      setIsLoading(false);
      return data.map((item: any) => ({
        id: item.place_id.toString(),
        placeName: item.display_name,
        coordinates: {
          longitude: parseFloat(item.lon),
          latitude: parseFloat(item.lat),
        },
        address: item.display_name,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed');
      setIsLoading(false);
      // Fallback to mock suggestions on error
      return getMockSuggestions(query);
    }
  }, [getMockSuggestions]);

  const reverseGeocode = useCallback(async (longitude: number, latitude: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        throw new Error('No address found');
      }

      return {
        placeName: data.features[0].place_name,
        address: data.features[0].place_name,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reverse geocoding failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { geocode, reverseGeocode, isLoading, error };
}
