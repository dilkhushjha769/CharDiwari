import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) return { properties: [], propertySubmissions: [] };
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { properties: [], propertySubmissions: [] };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('phone') || searchParams.get('ref') || searchParams.get('email') || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Please enter a phone number or submission reference to track.' }, { status: 400 });
    }

    const cleanQuery = query.toLowerCase();
    const cleanDigits = query.replace(/[^\d]/g, '');

    const db = readDb();
    const allProps = db.properties || [];

    // Filter properties matching query
    const matched = allProps.filter((p) => {
      // Match by submission_ref (e.g. DW-SUB-123456)
      if (p.submission_ref && p.submission_ref.toLowerCase() === cleanQuery) return true;

      // Match by exact ID or slug
      if (String(p.id) === cleanQuery || (p.slug && p.slug.toLowerCase() === cleanQuery)) return true;

      // Match by phone number (last 10 digits match)
      const pPhone = (p.seller_phone || p.seller?.phone || '').replace(/[^\d]/g, '');
      if (cleanDigits.length >= 10 && pPhone && (pPhone.includes(cleanDigits) || cleanDigits.includes(pPhone))) {
        return true;
      }

      // Match by email
      const pEmail = (p.seller_email || p.seller?.email || '').toLowerCase().trim();
      if (pEmail && cleanQuery.includes('@') && pEmail === cleanQuery) {
        return true;
      }

      return false;
    });

    // Format results with human-readable tracking metadata
    const results = matched.map((p) => {
      const isPending = p.status === 'pending_review' || p.status === 'pending';
      const isRejected = p.status === 'rejected';
      const isPublished = p.status === 'published' || (!p.status && !p.is_deleted);

      let status_badge = 'pending';
      let status_label = 'Under Admin Review';
      let status_description = 'Your property has been submitted and is currently being reviewed by the Dwarkesh Editorial Board.';

      if (isPublished) {
        status_badge = 'published';
        status_label = 'Approved & Live';
        status_description = 'Your property is verified and live on the Dwarkesh luxury marketplace.';
      } else if (isRejected) {
        status_badge = 'rejected';
        status_label = 'Rejected';
        status_description = p.admin_review_note || 'The listing was rejected during quality review. Please check the feedback note.';
      }

      return {
        id: p.id,
        slug: p.slug,
        submission_ref: p.submission_ref || `DW-SUB-${p.id}`,
        title: p.title,
        price: p.price,
        location: p.location,
        city: p.city,
        type: p.type,
        bhk: p.bhk || p.beds,
        area: p.area,
        image: p.image || (Array.isArray(p.gallery) ? p.gallery[0]?.url || p.gallery[0] : ''),
        status: p.status || 'published',
        status_badge,
        status_label,
        status_description,
        admin_review_note: p.admin_review_note || null,
        submitted_at: p.submitted_at || p.created_at,
        updated_at: p.updated_at,
        live_url: isPublished ? `/property/${p.slug || p.id}` : null,
        seller: {
          name: p.seller_name || p.seller?.name || '',
          phone: p.seller_phone || p.seller?.phone || '',
          role: p.seller_role || p.seller?.role || 'Owner',
        },
      };
    });

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      properties: results,
    });
  } catch (error) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('Error tracking property submission:', error);
    return NextResponse.json({ error: 'Failed to look up property status.' }, { status: 500 });
  }
}
