import { NextResponse } from 'next/server';
import { uploadMediaFile } from '@/lib/admin';

// Maximum upload limits for user property submissions
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const contentType = file.type || '';
    const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif)$/i.test(file.name);

    if (!isImage) {
      return NextResponse.json(
        { error: 'Only image files (JPG, PNG, WebP) are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Image file too large. Maximum size is 15MB.' },
        { status: 400 }
      );
    }

    let uploadResult;
    try {
      uploadResult = await uploadMediaFile(file, 'submissions');
    } catch (innerErr) {
      console.warn('[Upload Route] Fallback to direct Base64 Data URL:', innerErr.message);
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${contentType || 'image/jpeg'};base64,${base64}`;
      uploadResult = {
        url: dataUrl,
        filename: file.name || 'uploaded_image.jpg',
        sizeBytes: buffer.length,
      };
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      localUrl: uploadResult.localUrl || null,
      filename: uploadResult.filename,
      sizeBytes: uploadResult.sizeBytes,
    });
  } catch (error) {
    console.error('Error uploading property submission media:', error);
    // Even if top-level formData parse has issues, attempt minimal response
    return NextResponse.json({ error: error.message || 'Failed to upload photo.' }, { status: 400 });
  }
}
