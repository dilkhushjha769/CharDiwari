import { NextResponse } from 'next/server';
import { getAdminFromRequest, saveAdminProperty, deleteAdminProperty } from '@/lib/admin';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = await saveAdminProperty({ ...body, id });

    return NextResponse.json({
      success: true,
      property: result.property,
      savedToSupabase: result.savedToSupabase,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    await deleteAdminProperty(id);

    return NextResponse.json({ success: true, message: 'Property deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
