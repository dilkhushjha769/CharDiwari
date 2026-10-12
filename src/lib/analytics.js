'use client';

import { captureEvent } from './posthog';
import { trackUserActivity } from './visitor';

/**
 * Normalizes property entity to a clean analytics dictionary.
 * Prevents circular references, overly deep objects, or leaking internal sensitive fields.
 */
export function formatPropertyPayload(property) {
  if (!property) return {};

  const priceNum = property.priceNum || (typeof property.price === 'number' ? property.price : 0);
  let priceRange = 'Above ₹10 Cr';
  if (priceNum < 3) priceRange = 'Under ₹3 Cr';
  else if (priceNum <= 6) priceRange = '₹3 Cr - ₹6 Cr';
  else if (priceNum <= 10) priceRange = '₹6 Cr - ₹10 Cr';

  return {
    property_id: property.id ? String(property.id) : property.slug || 'unknown',
    property_slug: property.slug || '',
    property_title: property.title || 'Untitled Property',
    property_type: property.type || 'Unknown Type',
    category_id: property.type ? property.type.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'general',
    category_name: property.type || 'General',
    location: property.location || '',
    city: property.city || '',
    price_formatted: property.price || '',
    price_cr: priceNum,
    price_range: priceRange,
    beds: property.beds || '',
    area: property.area || '',
    builder: property.builder || '',
    possession: property.possession || '',
    tag: property.tag || '',
  };
}

/**
 * 1. Track Property Viewed
 */
export function trackPropertyViewed(property, extra = {}) {
  if (!property) return;
  captureEvent('property_viewed', {
    ...formatPropertyPayload(property),
    view_source: extra.source || 'direct',
    ...extra,
  });

  // Persist user activity to Supabase / local DB
  trackUserActivity({
    activityType: 'view',
    property,
    propertyId: property.id,
    propertySlug: property.slug,
    propertyTitle: property.title,
    propertyLocation: property.location,
    propertyPrice: property.price,
    propertyImage: property.image || (Array.isArray(property.images) ? property.images[0] : ''),
    categoryName: property.type || property.category || '',
  });
}

/**
 * 2. Track Category Viewed
 */
export function trackCategoryViewed(categoryName, extra = {}) {
  if (!categoryName) return;
  const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  captureEvent('category_viewed', {
    category_id: categoryId,
    category_name: categoryName,
    ...extra,
  });
}

/**
 * 3. Track Search Performed
 */
export function trackSearchPerformed(query, filters = {}, resultCount = 0) {
  const cleanQuery = query ? query.trim() : '';
  captureEvent('search_performed', {
    search_query: cleanQuery,
    has_query: Boolean(cleanQuery),
    city_filter: filters.city || 'All Cities',
    type_filter: filters.type || 'All Types',
    bhk_filter: filters.bhk || 'All BHK',
    budget_filter: filters.budget || 'Any Budget',
    possession_filter: filters.possession || 'All Possession',
    mode_filter: filters.mode || 'buy',
    result_count: resultCount,
  });

  // Persist user search activity (if text query or active filters present)
  const displayQuery =
    cleanQuery ||
    [filters.type, filters.city || filters.location]
      .filter(Boolean)
      .filter((s) => !s.startsWith('All') && s !== 'Property Type' && s !== 'Locations')
      .join(' in ') ||
    (filters.city && filters.city !== 'All Cities' ? `${filters.city} Properties` : '');

  if (displayQuery) {
    trackUserActivity({
      activityType: 'search',
      searchQuery: displayQuery,
      searchFilters: filters,
    });
  }
}

/**
 * 4. Track Search Result Clicked
 */
export function trackSearchResultClicked(property, position = 0, searchContext = {}) {
  if (!property) return;
  captureEvent('search_result_clicked', {
    ...formatPropertyPayload(property),
    position_index: position,
    search_query: searchContext.query || '',
    applied_city: searchContext.city || '',
    applied_type: searchContext.type || '',
  });

  // Clicking into a property records it as viewed
  trackPropertyViewed(property, { source: 'search_result_click' });
}

/**
 * 5. Track Filter Applied
 */
export function trackFilterApplied(filterType, filterValue, allActiveFilters = {}) {
  captureEvent('filter_applied', {
    filter_type: filterType,
    filter_value: String(filterValue),
    active_filters: allActiveFilters,
  });
}

/**
 * 6. Track Property Favorited / Shortlisted
 */
export function trackPropertyFavorited(property, isFavorited = true) {
  if (!property) return;
  captureEvent('property_favorited', {
    ...formatPropertyPayload(property),
    action: isFavorited ? 'favorite' : 'unfavorite',
  });

  if (isFavorited) {
    // Shortlisting a property inherently means it was viewed
    trackPropertyViewed(property, { source: 'shortlist' });
    trackUserActivity({
      activityType: 'shortlist',
      property,
      propertyId: property.id,
      propertySlug: property.slug,
      propertyTitle: property.title,
      propertyLocation: property.location,
      propertyPrice: property.price,
      propertyImage: property.image || (Array.isArray(property.images) ? property.images[0] : ''),
      categoryName: property.type || property.category || '',
    });
  }
}

/**
 * 7. Track Property Gallery Opened
 */
export function trackPropertyGalleryOpened(property, initialIndex = 0) {
  if (!property) return;
  captureEvent('property_gallery_opened', {
    ...formatPropertyPayload(property),
    initial_photo_index: initialIndex,
  });
}

/**
 * 8. Track Property Image / Slide Viewed
 */
export function trackPropertyImageViewed(property, photoIndex, totalPhotos = 1) {
  if (!property) return;
  captureEvent('property_image_viewed', {
    ...formatPropertyPayload(property),
    photo_index: photoIndex,
    total_photos: totalPhotos,
  });
}

/**
 * 9. Track Property Map Interacted (3D, Street View, Map, Commute, Nearby)
 */
export function trackPropertyMapInteracted(property, interactionType, extra = {}) {
  if (!property) return;
  captureEvent('property_map_interacted', {
    ...formatPropertyPayload(property),
    interaction_type: interactionType, // '3d' | 'street' | 'map' | 'nearby_places' | 'commute_check'
    ...extra,
  });
}

/**
 * 10. Track Contact Agent Clicked
 */
export function trackContactAgentClicked(property, contactMethod = 'general') {
  captureEvent('contact_agent_clicked', {
    ...(property ? formatPropertyPayload(property) : {}),
    contact_method: contactMethod, // 'whatsapp' | 'phone' | 'enquiry_form' | 'schedule_call'
  });

  if (property) {
    trackUserActivity({
      activityType: 'contact',
      property,
      propertyId: property.id,
      propertySlug: property.slug,
      propertyTitle: property.title,
      propertyLocation: property.location,
      propertyPrice: property.price,
      propertyImage: property.image || (Array.isArray(property.images) ? property.images[0] : ''),
      categoryName: property.type || property.category || '',
      contactMethod,
    });
  }
}

/**
 * 11. Track Phone Number Clicked
 */
export function trackPhoneNumberClicked(property, phoneNumber = '+91 98765 43210') {
  captureEvent('phone_number_clicked', {
    ...(property ? formatPropertyPayload(property) : {}),
    phone_number_redacted: phoneNumber.slice(-4), // Redact full personal numbers
    action: 'click_to_call',
  });

  if (property) {
    trackUserActivity({
      activityType: 'contact',
      property,
      contactMethod: 'phone',
    });
  }
}

/**
 * 12. Track WhatsApp Clicked
 */
export function trackWhatsAppClicked(property, context = 'general') {
  captureEvent('whatsapp_clicked', {
    ...(property ? formatPropertyPayload(property) : {}),
    context, // 'enquiry' | 'direct_chat' | 'expert_callback' | 'share'
  });

  if (property) {
    trackUserActivity({
      activityType: 'contact',
      property,
      contactMethod: 'whatsapp',
    });
  }
}


/**
 * 13. Track Visit Booking Started
 */
export function trackVisitBookingStarted(property) {
  if (!property) return;
  captureEvent('visit_booking_started', {
    ...formatPropertyPayload(property),
    step: 'initiated',
  });
}

/**
 * 14. Track Visit Booking Completed
 */
export function trackVisitBookingCompleted(property, bookingDetails = {}) {
  if (!property) return;
  captureEvent('visit_booking_completed', {
    ...formatPropertyPayload(property),
    booking_channel: bookingDetails.channel || 'whatsapp',
    authenticated_user: Boolean(bookingDetails.userId),
  });
}

/**
 * 15. Track Property Comparison Used
 */
export function trackPropertyComparisonUsed(comparedProperties = [], action = 'view_modal') {
  const propertyIds = comparedProperties.map((p) => p.id || p.slug);
  const propertyTitles = comparedProperties.map((p) => p.title);

  captureEvent('property_comparison_used', {
    comparison_action: action, // 'view_modal' | 'add_property' | 'remove_property' | 'clear_all'
    properties_count: comparedProperties.length,
    property_ids: propertyIds,
    property_titles: propertyTitles,
  });
}

/**
 * 16. Track Property Active Engagement Time
 */
export function trackPropertyEngagement(property, activeDurationSec, totalAccumulatedSec = null) {
  if (!property || activeDurationSec <= 0) return;
  const roundedSec = Math.round(activeDurationSec);
  captureEvent('property_engagement', {
    ...formatPropertyPayload(property),
    active_seconds: roundedSec,
    active_duration_seconds: roundedSec,
    active_minutes: Number((roundedSec / 60).toFixed(2)),
    total_accumulated_seconds: Math.round(totalAccumulatedSec ?? activeDurationSec),
  });
}

/**
 * 17. Track Category Active Engagement Time
 */
export function trackCategoryEngagement(categoryName, activeDurationSec, totalAccumulatedSec = null) {
  if (!categoryName || activeDurationSec <= 0) return;
  const roundedSec = Math.round(activeDurationSec);
  const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  captureEvent('category_engagement', {
    category_id: categoryId,
    category_name: categoryName,
    active_seconds: roundedSec,
    active_duration_seconds: roundedSec,
    active_minutes: Number((roundedSec / 60).toFixed(2)),
    total_accumulated_seconds: Math.round(totalAccumulatedSec ?? activeDurationSec),
  });
}
