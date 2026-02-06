const DEFAULT_UPLOAD_ORIGIN = 'https://score.yottascore.com';

/**
 * Normalize upload URL to use the correct domain (e.g. yottascore.com) before saving or returning.
 * Uses PHP_UPLOAD_URL env for origin so DB and API responses always have the right domain.
 */
export function normalizeUploadUrl(url: string | undefined): string | undefined {
  if (!url || typeof url !== 'string') return url;
  try {
    const base = process.env.PHP_UPLOAD_URL || `${DEFAULT_UPLOAD_ORIGIN}/upload.php`;
    const origin = new URL(base).origin;
    const pathname = new URL(url).pathname;
    return origin + pathname;
  } catch {
    return url;
  }
}
