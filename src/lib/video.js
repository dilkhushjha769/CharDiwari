/**
 * Video Parser & Embed Utility for Dwarkesh Real Estate
 * Handles YouTube (standard, shorts, embed, youtu.be), Vimeo, and direct video files (.mp4, .webm, .mov)
 */

export function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. YouTube Detection & Parsing
  // Handles:
  // - https://youtu.be/e1cwjeP5Ofs?si=...
  // - https://www.youtube.com/watch?v=e1cwjeP5Ofs
  // - https://www.youtube.com/embed/e1cwjeP5Ofs
  // - https://youtube.com/shorts/e1cwjeP5Ofs
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      originalUrl: trimmed,
    };
  }

  // 2. Vimeo Detection
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=0`,
      thumbnailUrl: null,
      originalUrl: trimmed,
    };
  }

  // 3. Direct HTML5 Video File (.mp4, .webm, .mov, Supabase Storage, /uploads/...)
  return {
    type: 'direct',
    embedUrl: trimmed,
    thumbnailUrl: null,
    originalUrl: trimmed,
  };
}
