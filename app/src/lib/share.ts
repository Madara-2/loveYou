import type { Personalization, Settings } from '@/config/types';

/**
 * Share links: pack personalization + key visual settings into a short
 * base64url query param (`?h=...`). Decoding is defensive — malformed or
 * unsupported input simply falls back to defaults.
 */

const KEYS = {
  r: 'recipient',
  s: 'signature',
  m: 'message',
  p: 'paletteId',
  v: 'style',
} as const;

type ShortKey = keyof typeof KEYS;

export function encodeShare(params: Partial<Settings>): string | null {
  try {
    const obj: Record<string, string> = {};
    if (params.recipient) obj.r = params.recipient;
    if (params.signature) obj.s = params.signature;
    if (params.message) obj.m = params.message;
    if (params.paletteId) obj.p = params.paletteId;
    if (params.style) obj.v = params.style;
    if (Object.keys(obj).length === 0) return null;
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return null;
  }
}

export function decodeShare(encoded: string | null | undefined): Partial<Personalization & Pick<Settings, 'paletteId' | 'style'>> {
  if (!encoded) return {};
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const obj = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const out: Partial<Settings> = {};
    (Object.keys(KEYS) as ShortKey[]).forEach((short) => {
      const value = obj[short];
      if (typeof value === 'string' && value.length <= 300) {
        (out as Record<string, string>)[KEYS[short]] = value;
      }
    });
    return out;
  } catch {
    return {};
  }
}

export function buildShareUrl(baseUrl: string, params: Partial<Settings>): string {
  const enc = encodeShare(params);
  if (!enc) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set('h', enc);
  return url.toString();
}
