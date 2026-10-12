'use client';

import { useMemo, useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'dwarkesh_saved_properties';
const EVENT_NAME = 'dwarkesh_saved_properties_changed';

function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getSavedFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function saveToStorage(list) {
  if (typeof window === 'undefined') return;
  try {
    const json = JSON.stringify(list);
    localStorage.setItem(STORAGE_KEY, json);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: list }));
  } catch (err) {}
}

// React SyncExternalStore subscription
function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}

let cachedRaw = '[]';
function getSnapshot() {
  if (typeof window === 'undefined') return '[]';
  try {
    const val = localStorage.getItem(STORAGE_KEY) || '[]';
    if (val !== cachedRaw) {
      cachedRaw = val;
    }
  } catch {
    cachedRaw = '[]';
  }
  return cachedRaw;
}

function getServerSnapshot() {
  return '[]';
}

/**
 * Universal hook for managing shortlisted/saved properties across the Dwarkesh website
 */
export function useSavedProperties() {
  const rawJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Synchronously compute the saved properties from the external store snapshot
  const savedProperties = useMemo(() => {
    try {
      const parsed = JSON.parse(rawJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawJson]);

  const isSaved = useCallback(
    (propOrId, maybeSlug) => {
      if (!propOrId && !maybeSlug) return false;
      const targetId =
        typeof propOrId === 'object'
          ? String(propOrId?.id ?? '')
          : String(propOrId ?? '');
      const targetSlug =
        typeof propOrId === 'object'
          ? String(propOrId?.slug || (propOrId?.title ? slugify(propOrId.title) : ''))
          : String(maybeSlug ?? '');

      return savedProperties.some((p) => {
        const pid = String(p.id ?? '').toLowerCase();
        const pslug = String(p.slug || '').toLowerCase();
        if (targetId && (pid === targetId.toLowerCase() || pslug === targetId.toLowerCase())) {
          return true;
        }
        if (targetSlug && (pid === targetSlug.toLowerCase() || pslug === targetSlug.toLowerCase())) {
          return true;
        }
        return false;
      });
    },
    [savedProperties]
  );

  const toggleSave = useCallback(
    (property) => {
      if (!property) return false;
      const current = getSavedFromStorage();
      const targetId = String(property.id ?? '').toLowerCase();
      const targetSlug = String(
        property.slug || (property.title ? slugify(property.title) : '')
      ).toLowerCase();

      const existsIndex = current.findIndex((p) => {
        const pid = String(p.id ?? '').toLowerCase();
        const pslug = String(p.slug || '').toLowerCase();
        return (
          (targetId && (pid === targetId || pslug === targetId)) ||
          (targetSlug && (pid === targetSlug || pslug === targetSlug))
        );
      });

      let nextList;
      let newlySaved = false;

      if (existsIndex !== -1) {
        // Remove from saved
        nextList = current.filter((_, idx) => idx !== existsIndex);
        newlySaved = false;
      } else {
        // Add to saved
        const cleanItem = {
          id: property.id ?? Date.now(),
          slug: property.slug || (property.title ? slugify(property.title) : `property-${property.id || Date.now()}`),
          title: property.title || 'Dwarkesh Luxury Property',
          location: property.location || property.city || 'India',
          city: property.city || '',
          price: property.price || 'Price on Request',
          rentPrice: property.rentPrice || '',
          image: property.image || (Array.isArray(property.images) ? property.images[0] : '') || '',
          beds: property.beds || '',
          baths: property.baths || '',
          area: property.area || '',
          type: property.type || 'Luxury Villa & Estate',
          badge: property.badge || 'Verified Property',
          tag: property.tag || 'Available',
          savedAt: new Date().toISOString(),
        };
        nextList = [cleanItem, ...current];
        newlySaved = true;
      }

      saveToStorage(nextList);
      return newlySaved;
    },
    []
  );

  const removeSaved = useCallback((propIdOrSlug) => {
    if (!propIdOrSlug) return;
    const current = getSavedFromStorage();
    const target = String(propIdOrSlug).toLowerCase();
    const nextList = current.filter((p) => {
      const pid = String(p.id ?? '').toLowerCase();
      const pslug = String(p.slug || '').toLowerCase();
      return pid !== target && pslug !== target;
    });
    saveToStorage(nextList);
  }, []);

  const clearAllSaved = useCallback(() => {
    saveToStorage([]);
  }, []);

  return {
    savedProperties,
    saveCount: savedProperties.length,
    isSaved,
    toggleSave,
    removeSaved,
    clearAllSaved,
  };
}
