import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, getUserActivityFeed } from '@/lib/activity';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = await getAuthenticatedUserId(request);
    if (!userId) {
      userId = searchParams.get('userId');
    }

    const visitorId = searchParams.get('visitorId') || request.cookies.get('dwarkesh_vid')?.value || null;

    const feed = await getUserActivityFeed(userId, visitorId);
    return NextResponse.json(feed);
  } catch (err) {
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err;
    }
    console.error('[API Activity List] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
  }
}
