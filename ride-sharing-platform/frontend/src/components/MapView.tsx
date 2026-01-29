'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface MapViewProps {
  className?: string;
  pickupLocation?: { latitude: number; longitude: number; address?: string } | null | undefined;
  dropoffLocation?: { latitude: number; longitude: number; address?: string } | null | undefined;
  driverLocation?: { latitude: number; longitude: number; heading?: number } | null | undefined;
  showRoute?: boolean;
  onPickupSelect?: (location: { latitude: number; longitude: number; address?: string }) => void;
  onDropoffSelect?: (location: { latitude: number; longitude: number; address?: string }) => void;
  onMapClick?: (location: { latitude: number; longitude: number }) => void;
  onETA?: (minutes: number, distance: number) => void;
  interactive?: boolean;
  heatmapData?: { lat: number; lng: number; intensity: number }[];
  selectingMode?: 'pickup' | 'dropoff' | null;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';

export function MapView({
  className,
  pickupLocation,
  dropoffLocation,
  driverLocation,
  showRoute = true,
  onPickupSelect,
  onDropoffSelect,
  interactive = true,
  heatmapData,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pickupMarker = useRef<maplibregl.Marker | null>(null);
  const dropoffMarker = useRef<maplibregl.Marker | null>(null);
  const driverMarker = useRef<maplibregl.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: [77.5946, 12.9716], // Default to Bangalore, India
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    if (interactive) {
      map.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right'
      );
    }

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    // Click handler for selecting locations - with reverse geocoding
    if (interactive && (onPickupSelect || onDropoffSelect)) {
      map.current.on('click', async (e) => {
        const lat = e.lngLat.lat;
        const lng = e.lngLat.lng;

        // Reverse geocode to get actual address
        let address = 'Selected location';
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          );
          const data = await response.json();
          address = data.display_name || 'Selected location';
        } catch (error) {
          console.error('Reverse geocode failed:', error);
        }

        const location = { latitude: lat, longitude: lng, address };

        // If no pickup, set pickup; otherwise set dropoff
        if (!pickupLocation && onPickupSelect) {
          onPickupSelect(location);
        } else if (onDropoffSelect) {
          onDropoffSelect(location);
        }
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Reverse geocode function
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || 'Selected location';
    } catch {
      return 'Selected location';
    }
  };

  // Update pickup marker
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    if (pickupMarker.current) {
      pickupMarker.current.remove();
    }

    if (pickupLocation) {
      pickupMarker.current = new maplibregl.Marker({ color: '#22c55e', draggable: true })
        .setLngLat([pickupLocation.longitude, pickupLocation.latitude])
        .setPopup(
          new maplibregl.Popup().setHTML(
            `<strong>Pickup</strong><br/>${pickupLocation.address || 'Drag to change'}`
          )
        )
        .addTo(map.current);

      // Handle drag end - reverse geocode new position
      pickupMarker.current.on('dragend', async () => {
        const lngLat = pickupMarker.current?.getLngLat();
        if (lngLat && onPickupSelect) {
          const address = await reverseGeocode(lngLat.lat, lngLat.lng);
          onPickupSelect({
            latitude: lngLat.lat,
            longitude: lngLat.lng,
            address,
          });
        }
      });

      // Fly to pickup if no dropoff yet
      if (!dropoffLocation) {
        map.current.flyTo({
          center: [pickupLocation.longitude, pickupLocation.latitude],
          zoom: 14,
          duration: 1500,
        });
      }
    }
  }, [pickupLocation, isLoaded, onPickupSelect]);

  // Update dropoff marker
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    if (dropoffMarker.current) {
      dropoffMarker.current.remove();
    }

    if (dropoffLocation) {
      dropoffMarker.current = new maplibregl.Marker({ color: '#ef4444', draggable: true })
        .setLngLat([dropoffLocation.longitude, dropoffLocation.latitude])
        .setPopup(
          new maplibregl.Popup().setHTML(
            `<strong>Dropoff</strong><br/>${dropoffLocation.address || 'Drag to change'}`
          )
        )
        .addTo(map.current);

      // Handle drag end - reverse geocode new position
      dropoffMarker.current.on('dragend', async () => {
        const lngLat = dropoffMarker.current?.getLngLat();
        if (lngLat && onDropoffSelect) {
          const address = await reverseGeocode(lngLat.lat, lngLat.lng);
          onDropoffSelect({
            latitude: lngLat.lat,
            longitude: lngLat.lng,
            address,
          });
        }
      });
    }
  }, [dropoffLocation, isLoaded, onDropoffSelect]);

  // Update driver marker
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    if (driverMarker.current) {
      driverMarker.current.remove();
    }

    if (driverLocation) {
      // Create custom driver icon
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${driverLocation.heading || 0}deg);
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L4 12h4v8h8v-8h4L12 2z"/>
          </svg>
        </div>
      `;

      driverMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([driverLocation.longitude, driverLocation.latitude])
        .addTo(map.current);
    }
  }, [driverLocation, isLoaded]);

  // Draw route
  useEffect(() => {
    if (!map.current || !isLoaded || !showRoute) return;
    if (!pickupLocation || !dropoffLocation) return;

    const drawRoute = async () => {
      setIsLoadingRoute(true);

      try {
        // Using OSRM for free routing (OpenStreetMap)
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickupLocation.longitude},${pickupLocation.latitude};${dropoffLocation.longitude},${dropoffLocation.latitude}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (!data.routes || data.routes.length === 0) return;

        const route = data.routes[0];

        // Remove existing route
        if (map.current?.getLayer('route')) {
          map.current.removeLayer('route');
        }
        if (map.current?.getSource('route')) {
          map.current.removeSource('route');
        }

        // Add new route
        map.current?.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          },
        });

        map.current?.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#22c55e',
            'line-width': 5,
            'line-opacity': 0.8,
          },
        });

        // Fit bounds
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce(
          (bounds: maplibregl.LngLatBounds, coord: [number, number]) =>
            bounds.extend(coord),
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );

        map.current?.fitBounds(bounds, { padding: 80 });
      } catch (error) {
        console.error('Failed to draw route:', error);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    drawRoute();
  }, [pickupLocation, dropoffLocation, showRoute, isLoaded]);

  // Add heatmap layer
  useEffect(() => {
    if (!map.current || !isLoaded || !heatmapData || heatmapData.length === 0) return;

    // Remove existing heatmap
    if (map.current.getLayer('heatmap')) {
      map.current.removeLayer('heatmap');
    }
    if (map.current.getSource('heatmap')) {
      map.current.removeSource('heatmap');
    }

    const features = heatmapData.map((point) => ({
      type: 'Feature' as const,
      properties: { intensity: point.intensity },
      geometry: {
        type: 'Point' as const,
        coordinates: [point.lng, point.lat],
      },
    }));

    map.current.addSource('heatmap', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    map.current.addLayer({
      id: 'heatmap',
      type: 'heatmap',
      source: 'heatmap',
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
  }, [heatmapData, isLoaded]);

  return (
    <div className={cn('relative h-full w-full min-h-[400px] rounded-lg overflow-hidden', className)}>
      <div ref={mapContainer} className="h-full w-full" />
      {(!isLoaded || isLoadingRoute) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}
