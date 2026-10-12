import { NextResponse } from 'next/server';
import { getAdminFromRequest, getAllAdminProperties, saveAdminProperty } from '@/lib/admin';

export async function GET(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const properties = await getAllAdminProperties();
    return NextResponse.json({ success: true, properties });
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
    if (!body.title || !body.price || !body.location) {
      return NextResponse.json({ error: 'Title, price, and location are required.' }, { status: 400 });
    }

    const result = await saveAdminProperty(body);
    return NextResponse.json({
      success: true,
      property: result.property,
      savedToSupabase: result.savedToSupabase,
      message: 'Property saved and synchronized successfully.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
