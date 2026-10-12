import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, migrateVisitorActivity, recordActivity } from '@/lib/activity';

export async function POST(request) {
  try {
    // 1. Authenticate user on the server (never trust client-supplied user ID)
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User authentication required for activity migration' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let visitorId = body?.visitorId;

    // Fallback to cookie if not in body
    if (!visitorId) {
      visitorId = request.cookies.get('dwarkesh_vid')?.value;
    }

    if (!visitorId || typeof visitorId !== 'string' || !visitorId.startsWith('vid_')) {
      return NextResponse.json(
        { error: 'Invalid or missing visitor identifier' },
        { status: 400 }
      );
    }

    // 2. Perform idempotent migration of server records
    const result = await migrateVisitorActivity(userId, visitorId);

    // 3. Merge any client-persisted offline/local activity items
    if (body?.localItems && typeof body.localItems === 'object') {
      const { views = [], searches = [], contacts = [] } = body.localItems;
      for (const v of views) {
        await recordActivity({ userId, visitorId, activityType: 'view', property: v });
      }
      for (const s of searches) {
        await recordActivity({ userId, visitorId, activityType: 'search', searchQuery: s.query, searchFilters: s.filters });
      }
      for (const c of contacts) {
        await recordActivity({ userId, visitorId, activityType: 'contact', property: c, contactMethod: c.method });
      }
    }

    return NextResponse.json({
      success: true,
      migratedCount: result.migratedCount || 0,
      userId,
    });
  } catch (err) {
    console.error('[API Activity Migrate] Error:', err);
    return NextResponse.json({ error: 'Failed to migrate user activity' }, { status: 500 });
  }
}
