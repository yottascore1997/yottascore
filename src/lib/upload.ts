/**
 * Single source for upload URL – sab jagah yahi use karo.
 * .env mein sirf PHP_UPLOAD_URL change karo, poora app usi se chalega.
 *
 * .env example:
 *   PHP_UPLOAD_URL=https://files.yottascore.com/upload.php
 */

const DEFAULT_UPLOAD_URL = 'https://files.yottascore.com/upload.php';

function getUploadUrlFromEnv(): string {
  const env = process.env.PHP_UPLOAD_URL || DEFAULT_UPLOAD_URL;
  if (env && env.includes('beyondspacework')) return DEFAULT_UPLOAD_URL;
  return env;
}

/** Upload API endpoint – POST file yahi bhejna hai */
export function getUploadEndpointUrl(): string {
  return getUploadUrlFromEnv();
}

/** Images display ke liye base origin – normalize karte waqt use hota hai */
export function getUploadOrigin(): string {
  try {
    return new URL(getUploadUrlFromEnv()).origin;
  } catch {
    return 'https://files.yottascore.com';
  }
}

/**
 * Koi bhi upload image URL ko env wale base par lao – display hamesha sahi domain se ho.
 */
export function normalizeUploadUrl(url: string | undefined): string | undefined {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return url;
  try {
    if (trimmed.startsWith('/')) {
      return getUploadOrigin() + trimmed;
    }
    const parsed = new URL(trimmed);
    return getUploadOrigin() + parsed.pathname;
  } catch {
    return url;
  }
}
