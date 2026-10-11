'use client';

import { useState, useEffect, useCallback } from 'react';

// In-memory cache across component mounts in the same session
let cachedLocation = null;
let listeners = new Set();

const notifyListeners = (data) => {
  listeners.forEach((listener) => listener(data));
};

function getInitialLocation() {
  if (cachedLocation) return cachedLocation;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('dwarkesh_user_loc');
      if (stored) {
        cachedLocation = JSON.parse(stored);
        return cachedLocation;
      }
    } catch (_) {}
  }
  return null;
}

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState(getInitialLocation);
  const [locationLoading, setLocationLoading] = useState(() => !getInitialLocation());

  const parseLocationData = (data) => {
    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      'India';
    const state = data.principalSubdivision || '';
    const locality = data.locality && data.locality !== city ? data.locality : '';

    let display = city;
    if (locality && city) {
      display = `${locality}, ${city}`;
    } else if (city && state && city !== state) {
      display = `${city}, ${state}`;
    } else if (city) {
      display = city;
    }

    return {
      city,
      state,
      locality,
      display,
      country: data.countryName || 'India',
      latitude: data.latitude,
      longitude: data.longitude,
      source: data.lookupSource || 'reverse-geocoded',
    };
  };

  const fetchLocation = useCallback(async (coords = null) => {
    try {
      setLocationLoading(true);
      let url = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
      if (coords) {
        url += `?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to reverse geocode');
      const data = await res.json();
      const loc = parseLocationData(data);

      cachedLocation = loc;
      setUserLocation(loc);
      notifyListeners(loc);

      // Save to sessionStorage for fast subsequent loads
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('dwarkesh_user_loc', JSON.stringify(loc));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Location detection fallback:', err);
      // Graceful fallback if offline or blocked
      if (!cachedLocation) {
        const fallback = {
          city: 'Ahmedabad',
          state: 'Gujarat',
          locality: 'Bodakdev',
          display: 'Ahmedabad, Gujarat',
          country: 'India',
          source: 'default',
        };
        cachedLocation = fallback;
        setUserLocation(fallback);
        notifyListeners(fallback);
      }
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const refreshGpsLocation = useCallback(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos?.coords) {
            fetchLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        },
        (err) => {
          console.warn('GPS prompt denied or failed:', err);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      fetchLocation();
    }
  }, [fetchLocation]);

  useEffect(() => {
    const handleUpdate = (newLoc) => {
      setUserLocation(newLoc);
      setLocationLoading(false);
    };

    listeners.add(handleUpdate);

    // Auto-fetch if not yet loaded
    let timerId = null;
    if (!cachedLocation) {
      timerId = setTimeout(() => {
        fetchLocation();
      }, 0);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      listeners.delete(handleUpdate);
    };
  }, [fetchLocation]);

  return {
    userLocation,
    locationLoading,
    refreshGpsLocation,
  };
}
