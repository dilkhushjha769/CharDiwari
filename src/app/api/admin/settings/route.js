import { NextResponse } from 'next/server';
import { getAdminFromRequest, getWebsiteSettings, updateWebsiteSettings } from '@/lib/admin';

export async function GET() {
  try {
    const settings = await getWebsiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const body = await request.json();
    const result = await updateWebsiteSettings(body);
    return NextResponse.json({
      success: true,
      settings: result.settings,
      savedToSupabase: result.savedToSupabase,
      message: 'Website settings and access policies updated successfully.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
