'use client';

import React from 'react';
import NewPropertyPage from '@/app/admin/properties/new/page';

/**
 * Public "Post Property" portal.
 * Powered directly by the luxury multi-step property suite with seller contact verification,
 * interactive map plotting, luxury amenities, executive review, and real-time status tracking.
 */
export default function PostPropertyPage() {
  return <NewPropertyPage isPublicPortal={true} />;
}
