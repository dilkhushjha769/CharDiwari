'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'dwarkesh_user_loc';
let cachedLocation = null;
let listeners = new Set();

const notifyListeners = (data) => {
  listeners.forEach((listener) => {
    try {
      listener(data);
    } catch (_) {}
  });
};

function getStoredLocation() {
  if (cachedLocation) return cachedLocation;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Discard any previous fake fallback entries
        if (
          parsed &&
          parsed.city &&
          parsed.source !== 'default' &&
          parsed.city.toLowerCase() !== 'ahmedabad'
        ) {
          cachedLocation = parsed;
          return parsed;
        } else {
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (_) {}
  }
  return null;
}

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const hasAutoFetchedRef = useRef(false);

  const saveLocation = useCallback((loc) => {
    if (!loc || !loc.city || loc.source === 'default') return;
    cachedLocation = loc;
    setUserLocation(loc);
    notifyListeners(loc);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      } catch (_) {}
    }
  }, []);

  // 1. Reverse-geocode exact GPS coordinates
  const reverseGeocodeCoords = useCallback(
    async (lat, lon) => {
      // Try BigDataCloud reverse geocode with coordinates
      try {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          const city =
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            '';
          const state = data.principalSubdivision || '';
          const locality = data.locality && data.locality !== city ? data.locality : '';

          if (city) {
            let display = city;
            if (locality && city) {
              display = `${locality}, ${city}`;
            } else if (city && state && city.toLowerCase() !== state.toLowerCase()) {
              display = `${city}, ${state}`;
            }

            const loc = {
              city,
              state,
              locality,
              display,
              country: data.countryName || 'India',
              latitude: lat,
              longitude: lon,
              source: 'gps',
              timestamp: Date.now(),
            };
            saveLocation(loc);
            return loc;
          }
        }
      } catch (e) {
        console.warn('BigDataCloud reverse geocode failed, trying OpenStreetMap:', e);
      }

      // Fallback: OpenStreetMap Nominatim reverse geocode
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.city_district ||
            addr.suburb ||
            addr.county ||
            addr.state_district ||
            '';
          const state = addr.state || '';
          const locality = addr.suburb || addr.neighbourhood || '';

          if (city) {
            let display = city;
            if (locality && locality !== city) {
              display = `${locality}, ${city}`;
            } else if (city && state && city.toLowerCase() !== state.toLowerCase()) {
              display = `${city}, ${state}`;
            }

            const loc = {
              city,
              state,
              locality,
              display,
              country: addr.country || 'India',
              latitude: lat,
              longitude: lon,
              source: 'gps-osm',
              timestamp: Date.now(),
            };
            saveLocation(loc);
            return loc;
          }
        }
      } catch (e) {
        console.warn('Nominatim reverse geocode failed:', e);
      }

      return null;
    },
    [saveLocation]
  );

  // 2. High-accuracy IP Geolocation (ONLY called if GPS denied / unavailable)
  const detectIpLocation = useCallback(async () => {
    // Provider A: ipwho.is (fast and accurate ISP mapping for India)
    try {
      const res = await fetch('https://ipwho.is/', {
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.city) {
          const city = data.city;
          const state = data.region || '';
          let display = city;
          if (state && city.toLowerCase() !== state.toLowerCase()) {
            display = `${city}, ${state}`;
          }

          const loc = {
            city,
            state,
            locality: '',
            display,
            country: data.country || 'India',
            latitude: data.latitude,
            longitude: data.longitude,
            source: 'ip-whois',
            timestamp: Date.now(),
          };
          saveLocation(loc);
          return loc;
        }
      }
    } catch (e) {
      console.warn('ipwho.is failed, trying BigDataCloud IP fallback:', e);
    }

    // Provider B: BigDataCloud client IP
    try {
      const res = await fetch(
        'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en',
        { signal: AbortSignal.timeout(4500) }
      );
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const state = data.principalSubdivision || '';
        if (city) {
          let display = city;
          if (state && city.toLowerCase() !== state.toLowerCase()) {
            display = `${city}, ${state}`;
          }
          const loc = {
            city,
            state,
            locality: data.locality || '',
            display,
            country: data.countryName || 'India',
            latitude: data.latitude,
            longitude: data.longitude,
            source: 'ip-bdc',
            timestamp: Date.now(),
          };
          saveLocation(loc);
          return loc;
        }
      }
    } catch (_) {}

    return null;
  }, [saveLocation]);

  // Main location fetcher: Always prioritizes GPS first!
  const fetchLocation = useCallback(
    async (manualGps = false) => {
      setLocationLoading(true);

      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (pos?.coords) {
              const res = await reverseGeocodeCoords(
                pos.coords.latitude,
                pos.coords.longitude
              );
              if (!res) {
                // If reverse geocode failed, try IP
                await detectIpLocation();
              }
              setLocationLoading(false);
            }
          },
          async (err) => {
            console.warn('GPS unavailable or denied:', err.message);
            // GPS failed or denied: cleanly fall back to IP location
            await detectIpLocation();
            setLocationLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: manualGps ? 10000 : 7000,
            maximumAge: manualGps ? 0 : 60000,
          }
        );
      } else {
        // Geolocation not supported: use IP location
        await detectIpLocation();
        setLocationLoading(false);
      }
    },
    [reverseGeocodeCoords, detectIpLocation]
  );

  // Manual GPS refresh button
  const refreshGpsLocation = useCallback(() => {
    fetchLocation(true);
  }, [fetchLocation]);

  // AUTO-DETECT ON WEBSITE OPEN
  useEffect(() => {
    const stored = getStoredLocation();
    if (stored) {
      setUserLocation(stored);
      setLocationLoading(false);
    }

    const handleUpdate = (newLoc) => {
      setUserLocation(newLoc);
      setLocationLoading(false);
    };

    listeners.add(handleUpdate);

    if (!hasAutoFetchedRef.current) {
      hasAutoFetchedRef.current = true;
      // Start auto-detecting with GPS priority immediately
      fetchLocation(false);
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, [fetchLocation]);

  return {
    userLocation,
    locationLoading,
    refreshGpsLocation,
  };
}
