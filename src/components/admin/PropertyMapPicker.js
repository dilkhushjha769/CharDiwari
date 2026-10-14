'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut, Crosshair, Home } from 'lucide-react';

// Category color and SVG icon mapper for nearby landmark pins
const getCategoryMeta = (type) => {
  switch (type) {
    case 'metro':
      return {
        color: '#2563eb', // Blue
        bgColor: '#eff6ff',
        label: 'Metro',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`,
      };
    case 'airport':
      return {
        color: '#7c3aed', // Purple
        bgColor: '#f5f3ff',
        label: 'Airport',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>`,
      };
    case 'hospital':
      return {
        color: '#dc2626', // Red
        bgColor: '#fef2f2',
        label: 'Hospital',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 6v12"/><path d="M6 12h12"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`,
      };
    case 'school':
      return {
        color: '#d97706', // Amber
        bgColor: '#fffbeb',
        label: 'School',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.42 10.922a1 1 0 0 0-.019-.838L12.83 3.18a2 2 0 0 0-1.66 0L2.6 10.086a1 1 0 0 0 0 1.828l8.57 6.904a2 2 0 0 0 1.66 0l8.57-6.904a1 1 0 0 0 .02-.992z"/><path d="M6 12.5v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>`,
      };
    case 'mall':
      return {
        color: '#db2777', // Pink
        bgColor: '#fdf2f8',
        label: 'Mall',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
      };
    case 'beach':
      return {
        color: '#0891b2', // Cyan
        bgColor: '#ecfeff',
        label: 'Waterfront',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
      };
    case 'railway':
      return {
        color: '#0284c7', // Sky
        bgColor: '#f0f9ff',
        label: 'Railway',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`,
      };
    case 'highway':
      return {
        color: '#059669', // Emerald
        bgColor: '#ecfdf5',
        label: 'Highway',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m4 19 4-14h8l4 14"/><path d="M12 5v14"/><path d="M8 12h8"/></svg>`,
      };
    default:
      return {
        color: '#475569', // Slate
        bgColor: '#f8fafc',
        label: 'Place',
        iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
      };
  }
};

export default function PropertyMapPicker({
  propertyCoords = { lat: 28.4595, lng: 77.0266 },
  onCoordsChange,
  propertyTitle = 'Main Property',
  nearbyLocations = [],
  selectedNearbyIndex = null,
  onSelectNearby,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const propertyMarkerRef = useRef(null);
  const nearbyMarkersRef = useRef([]);
  const onCoordsChangeRef = useRef(onCoordsChange);
  const onSelectNearbyRef = useRef(onSelectNearby);

  useEffect(() => {
    onCoordsChangeRef.current = onCoordsChange;
  }, [onCoordsChange]);

  useEffect(() => {
    onSelectNearbyRef.current = onSelectNearby;
  }, [onSelectNearby]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapType, setMapType] = useState('street'); // 'street' | 'satellite'

  // Initialize MapLibre GL
  useEffect(() => {
    let isMounted = true;
    let mapInstance = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const [maplibreglModule, libModule] = await Promise.all([
          import('maplibre-gl'),
          import('@/lib/maplibre'),
        ]);
        const maplibregl = maplibreglModule.default;
        await import('maplibre-gl/dist/maplibre-gl.css');

        if (!isMounted) return;

        const defaultLat = Number(propertyCoords?.lat) || 28.4595;
        const defaultLng = Number(propertyCoords?.lng) || 77.0266;
        const initialStyle = await libModule.loadSiteStyle();

        mapInstance = new maplibregl.Map({
          container: mapContainerRef.current,
          style: initialStyle,
          center: [defaultLng, defaultLat],
          zoom: 12.8,
          pitch: 15,
          attributionControl: false,
        });

        mapRef.current = mapInstance;

        mapInstance.on('load', () => {
          if (!isMounted) return;
          setMapLoaded(true);

          // Add Connecting Line Source
          mapInstance.addSource('connecting-lines', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          });

          // Dashed Distance Route Lines
          mapInstance.addLayer({
            id: 'connecting-lines-layer',
            type: 'line',
            source: 'connecting-lines',
            paint: {
              'line-color': '#0f172a',
              'line-width': 1.5,
              'line-dasharray': [2.5, 2.5],
              'line-opacity': 0.65,
            },
          });

          // Main Home Pin Marker (Distinctive Home Crest)
          const propertyEl = document.createElement('div');
          propertyEl.className = 'property-main-marker cursor-grab';
          propertyEl.innerHTML = `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              transform: translate(-50%, -100%);
              cursor: pointer;
            ">
              <div style="
                background: #09090b;
                color: #ffffff;
                padding: 5px 12px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 700;
                box-shadow: 0 4px 14px rgba(0,0,0,0.35);
                border: 2px solid #ffffff;
                white-space: nowrap;
                margin-bottom: 3px;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <span style="display: flex; align-items: center; color: #ffffff;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </span>
                <span>Main Property (Home)</span>
              </div>
              <div style="
                width: 28px;
                height: 28px;
                background: #09090b;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
              ">
                <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
              </div>
              <div style="width: 2px; height: 10px; background: #09090b;"></div>
            </div>
          `;

          const pMarker = new maplibregl.Marker({
            element: propertyEl,
            draggable: true,
          })
            .setLngLat([defaultLng, defaultLat])
            .addTo(mapInstance);

          propertyMarkerRef.current = pMarker;

          pMarker.on('dragend', () => {
            const lngLat = pMarker.getLngLat();
            if (onCoordsChangeRef.current) {
              onCoordsChangeRef.current({
                lat: parseFloat(lngLat.lat.toFixed(6)),
                lng: parseFloat(lngLat.lng.toFixed(6)),
              });
            }
          });

          mapInstance.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            pMarker.setLngLat([lng, lat]);
            if (onCoordsChangeRef.current) {
              onCoordsChangeRef.current({
                lat: parseFloat(lat.toFixed(6)),
                lng: parseFloat(lng.toFixed(6)),
              });
            }
          });
        });

        mapInstance.on('error', () => {
          console.warn('MapLibre load notice');
        });
      } catch (err) {
        console.warn('MapLibre init error:', err);
        if (isMounted) setMapError(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {}
      }
    };
  }, []);

  // Sync property marker when coords change
  useEffect(() => {
    if (!mapRef.current || !propertyMarkerRef.current) return;
    const lat = Number(propertyCoords?.lat);
    const lng = Number(propertyCoords?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    propertyMarkerRef.current.setLngLat([lng, lat]);
  }, [propertyCoords?.lat, propertyCoords?.lng]);

  // Render nearby location markers & connecting distance lines on map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing landmark markers
    nearbyMarkersRef.current.forEach((m) => m.remove());
    nearbyMarkersRef.current = [];

    import('maplibre-gl').then(({ default: maplibregl }) => {
      const propLat = Number(propertyCoords?.lat) || 28.4595;
      const propLng = Number(propertyCoords?.lng) || 77.0266;

      const lineFeatures = [];

      nearbyLocations.forEach((place, index) => {
        let lat = Number(place.lat);
        let lng = Number(place.lng);

        // If coordinates missing, position radially based on distance
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
          const angle = (index * (360 / Math.max(nearbyLocations.length, 1)) * Math.PI) / 180;
          const distKm = Number(place.km) || index + 1.2;
          const latOffset = (distKm / 111) * Math.cos(angle);
          const lngOffset = (distKm / (111 * Math.cos((propLat * Math.PI) / 180))) * Math.sin(angle);
          lat = propLat + latOffset;
          lng = propLng + lngOffset;
        }

        // Add line connecting home to landmark
        lineFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [propLng, propLat],
              [lng, lat],
            ],
          },
          properties: {
            name: place.name,
            km: place.km,
          },
        });

        const isSelected = selectedNearbyIndex === index;
        const meta = getCategoryMeta(place.type);

        const el = document.createElement('div');
        el.className = 'nearby-landmark-marker cursor-pointer transition-transform hover:scale-105';
        el.style.transform = 'translate(-50%, -100%)';
        el.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <div style="
              background: ${isSelected ? '#09090b' : '#ffffff'};
              color: ${isSelected ? '#ffffff' : '#0f172a'};
              padding: 4px 9px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 12px rgba(0,0,0,0.18);
              border: 1.5px solid ${meta.color};
              white-space: nowrap;
              margin-bottom: 2px;
              display: flex;
              align-items: center;
              gap: 5px;
            ">
              <span style="color: ${meta.color}; display: flex; align-items: center;">
                ${meta.iconSvg}
              </span>
              <span>${place.name || meta.label}</span>
              <span style="
                background: ${isSelected ? '#27272a' : meta.bgColor};
                color: ${meta.color};
                padding: 1px 6px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 800;
              ">
                ${place.km ? `${place.km} km from Home` : ''}
              </span>
            </div>
            <div style="
              width: 18px;
              height: 18px;
              background: ${meta.color};
              border: 2.5px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectNearbyRef.current) onSelectNearbyRef.current(index);
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 13.5, duration: 600 });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        nearbyMarkersRef.current.push(marker);
      });

      // Update connecting dashed lines layer
      if (mapRef.current && typeof mapRef.current.getSource === 'function') {
        const source = mapRef.current.getSource('connecting-lines');
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: lineFeatures,
          });
        }
      }
    });
  }, [nearbyLocations, selectedNearbyIndex, mapLoaded, propertyCoords]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleCenterProperty = () => {
    const lat = Number(propertyCoords?.lat) || 28.4595;
    const lng = Number(propertyCoords?.lng) || 77.0266;
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, duration: 800 });
  };

  const handleStyleChange = async (type) => {
    if (type === mapType || !mapRef.current) return;
    setMapType(type);
    try {
      const { getSatelliteStyle, loadSiteStyle } = await import('@/lib/maplibre');
      const nextStyle = type === 'satellite' ? getSatelliteStyle() : await loadSiteStyle();
      mapRef.current.setStyle(nextStyle);
      mapRef.current.once('style.load', () => {
        if (!mapRef.current.getSource('connecting-lines')) {
          mapRef.current.addSource('connecting-lines', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });
          mapRef.current.addLayer({
            id: 'connecting-lines-layer',
            type: 'line',
            source: 'connecting-lines',
            paint: {
              'line-color': type === 'satellite' ? '#ffffff' : '#0f172a',
              'line-width': 1.5,
              'line-dasharray': [2.5, 2.5],
              'line-opacity': 0.75,
            },
          });
        }
      });
    } catch (err) {
      console.warn('Style switch failed:', err);
    }
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[440px] rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200/90 shadow-inner bg-stone-100">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Fallback */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-50">
          <MapPin className="w-8 h-8 text-stone-600 mb-2" />
          <h4 className="text-sm font-bold text-stone-900">Interactive Map Preview</h4>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            Property centered at Latitude: {propertyCoords.lat}, Longitude: {propertyCoords.lng}.
          </p>
        </div>
      )}

      {/* Header Info Overlay */}
      <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 z-10 flex flex-col gap-1.5 max-w-[85%] sm:max-w-sm">
        <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200 text-xs font-bold text-stone-900 shadow-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-300" />
          <span className="truncate">Home & Nearest Landmarks</span>
        </div>
        <div className="text-[10px] text-stone-600 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-stone-200/80 shadow-xs hidden sm:block">
          Dashed lines show distances directly from the main property to each landmark.
        </div>
      </div>

      {/* Map Style Selector: Street Map vs Satellite */}
      <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 flex items-center bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200 shadow-md">
        <button
          type="button"
          onClick={() => handleStyleChange('street')}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
            mapType === 'street'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-black hover:bg-stone-100'
          }`}
        >
          Street
        </button>
        <button
          type="button"
          onClick={() => handleStyleChange('satellite')}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
            mapType === 'satellite'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-black hover:bg-stone-100'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200 shadow-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 sm:p-2 rounded-xl hover:bg-stone-100 text-stone-700 hover:text-black transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 sm:p-2 rounded-xl hover:bg-stone-100 text-stone-700 hover:text-black transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <div className="h-px w-full bg-stone-200 my-0.5" />
        <button
          type="button"
          onClick={handleCenterProperty}
          className="p-1.5 sm:p-2 rounded-xl hover:bg-stone-100 text-stone-700 hover:text-black transition cursor-pointer"
          title="Recenter on Property"
        >
          <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/90 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold shadow-md flex items-center gap-1.5 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>Main Home</span>
        </div>

        {nearbyLocations.length > 0 && (
          <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-stone-800 text-[10px] sm:text-[11px] font-medium shadow-md border border-stone-200 flex items-center gap-1.5 hidden xs:flex">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>{nearbyLocations.length} Landmarks</span>
          </div>
        )}
      </div>
    </div>
  );
}
