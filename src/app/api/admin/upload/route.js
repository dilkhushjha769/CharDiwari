import { NextResponse } from 'next/server';
import { getAdminFromRequest, uploadMediaFile } from '@/lib/admin';

// Maximum upload limits
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_VIDEO_BYTES = 150 * 1024 * 1024; // 150 MB

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/mpeg',
  'video/ogg',
];

export async function POST(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin credentials required to upload media.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'properties';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No media file provided.' }, { status: 400 });
    }

    const contentType = file.type || '';
    const isVideo = contentType.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: 'Invalid file format. Only image files (JPG, PNG, WebP) and video files (MP4, WebM, MOV) are accepted.' },
        { status: 400 }
      );
    }

    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      const limitMb = Math.round(limit / (1024 * 1024));
      return NextResponse.json(
        { error: `File too large. Maximum size for ${isVideo ? 'video' : 'image'} is ${limitMb}MB.` },
        { status: 400 }
      );
    }

    const uploadResult = await uploadMediaFile(file, category);

    return NextResponse.json({
      success: true,
      media: uploadResult,
      message: `${isVideo ? 'Video' : 'Image'} uploaded and stored securely.`,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: error.message || 'Media upload failed.' }, { status: 500 });
  }
}
