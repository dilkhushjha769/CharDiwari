'use client';

import { useCallback, useState } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import NeighbourhoodViewer from './NeighbourhoodViewer';
import CommuteCheck from './CommuteCheck';
import { NearbyIcon, nearbyColor } from './nearby';

export default function PropertyLocationSection({ property, detail }) {
  const [selectedPlaceName, setSelectedPlaceName] = useState(null);
  const [hoveredPlaceName, setHoveredPlaceName] = useState(null);

  const nearby = [...(detail.nearby ?? [])].sort((a, b) => a.km - b.km);

  const handleSelectPlace = useCallback((name) => {
    setSelectedPlaceName((curr) => (curr === name ? null : name));
  }, []);

  const handleHoverPlace = useCallback((name) => {
    setHoveredPlaceName(name);
  }, []);

  return (
    <div className="grid gap-4">
      {/* 3D, Map and Street View neighbourhood viewer with interactive category-colored labels */}
      <NeighbourhoodViewer
        property={property}
        detail={detail}
        selectedPlaceName={selectedPlaceName}
        hoveredPlaceName={hoveredPlaceName}
        onSelectPlace={setSelectedPlaceName}
        onHoverPlace={setHoveredPlaceName}
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="grid content-start gap-4">
          <div className="rounded-3xl border border-stone-200/90 bg-stone-50/70 p-6">
            <p className="flex items-start gap-2 text-sm font-semibold text-stone-900">
              <MapPin className="mt-0.5 w-4 h-4 shrink-0 text-stone-500" />
              {property.location}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.title}, ${property.location}`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-900 hover:text-white dark:hover:bg-stone-200 dark:hover:text-stone-900 transition-colors focus-ring"
            >
              Directions on Google Maps
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <CommuteCheck detail={detail} />
        </div>

        {nearby.length ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 text-xs font-medium text-stone-500">
              <span>Nearby Places</span>
              <span className="text-[11px] text-stone-400">Click a place to focus on map</span>
            </div>
            <ul className="divide-y divide-stone-100 rounded-3xl border border-stone-200/90 bg-white dark:bg-stone-50 shadow-sm overflow-hidden">
              {nearby.map((place) => {
                const color = nearbyColor(place.type);
                const isSelected = selectedPlaceName === place.name;
                const isHovered = hoveredPlaceName === place.name;

                return (
                  <li key={place.name}>
                    <button
                      type="button"
                      onClick={() => handleSelectPlace(place.name)}
                      onMouseEnter={() => handleHoverPlace(place.name)}
                      onMouseLeave={() => handleHoverPlace(null)}
                      aria-pressed={isSelected}
                      className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-sm text-left transition-all duration-150 focus-ring ${
                        isSelected
                          ? 'bg-stone-100/80 ring-1 ring-inset ring-stone-300'
                          : isHovered
                          ? 'bg-stone-50/90'
                          : 'hover:bg-stone-50/60'
                      }`}
                    >
                      {/* Category colored icon container */}
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-150"
                        style={{
                          backgroundColor: `${color}18`,
                          color: color,
                          transform: isSelected || isHovered ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        <NearbyIcon type={place.type} className="w-4 h-4 shrink-0" style={{ color }} />
                      </span>

                      {/* Place name with selection indicator */}
                      <span className={`flex-1 truncate ${isSelected ? 'font-semibold text-stone-950' : 'text-stone-800'}`}>
                        {place.name}
                      </span>

                      {/* Distance pill with matching category accent */}
                      <span
                        className="text-xs font-semibold tabular-nums shrink-0 transition-colors"
                        style={{ color: isSelected ? color : '#78716c' }}
                      >
                        {place.km} km by road
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
