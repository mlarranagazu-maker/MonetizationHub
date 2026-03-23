import { createHash } from 'crypto';
import { Deal } from '../types.js';
import { extractAsin } from './affiliate.js';

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    const dropParams = [
      'tag',
      'ref',
      'ref_',
      'ascsubtag',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
    ];
    dropParams.forEach(p => u.searchParams.delete(p));

    u.hash = '';

    const host = u.hostname.replace(/^www\./, '');
    const pathname = u.pathname.replace(/\/+$/g, '');

    return `${host}${pathname}`;
  } catch {
    return null;
  }
}

export function computeDealFingerprint(deal: Deal): string {
  const asin = extractAsin(deal.productLink) || extractAsin(deal.affiliateLink);
  if (asin) {
    return `${deal.provider}:asin:${asin}`;
  }

  const normalizedUrl = normalizeUrl(deal.productLink) || normalizeUrl(deal.affiliateLink);
  if (normalizedUrl) {
    return `${deal.provider}:url:${normalizedUrl}`;
  }

  const base = `${deal.provider}:title:${normalizeTitle(deal.title)}`;
  const hash = createHash('sha1').update(base).digest('hex');
  return `${deal.provider}:h:${hash}`;
}
