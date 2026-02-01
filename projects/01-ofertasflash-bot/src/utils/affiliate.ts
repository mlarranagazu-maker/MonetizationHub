// Generación de links de afiliado

/**
 * Genera link de afiliado según el proveedor
 */
export function generateAffiliateLink(
  productLink: string,
  providerId: string,
  affiliateTag?: string,
  affiliateNetwork?: 'awin' | 'tradedoubler' | 'direct',
  networkId?: string
): string {
  
  // Amazon: añadir tag directamente
  if (providerId.startsWith('amazon_')) {
    const tag = affiliateTag || 'monetizehub-21';
    const url = new URL(productLink);
    url.searchParams.set('tag', tag);
    // Limpiar tracking innecesario
    url.searchParams.delete('ref');
    url.searchParams.delete('ref_');
    return url.toString();
  }
  
  // Awin: usar deeplink wrapper
  if (affiliateNetwork === 'awin' && networkId) {
    const publisherId = process.env.AWIN_PUBLISHER_ID || '';
    const encodedUrl = encodeURIComponent(productLink);
    return `https://www.awin1.com/cread.php?awinmid=${networkId}&awinaffid=${publisherId}&ued=${encodedUrl}`;
  }
  
  // TradeDoubler
  if (affiliateNetwork === 'tradedoubler') {
    // Implementar si es necesario
    return productLink;
  }
  
  // Directo o desconocido: devolver link original
  return productLink;
}

/**
 * Extrae ASIN de URL de Amazon
 */
export function extractAsin(amazonUrl: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /asin=([A-Z0-9]{10})/i,
  ];
  
  for (const pattern of patterns) {
    const match = amazonUrl.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  
  return null;
}

/**
 * Genera link corto para Amazon con solo ASIN
 */
export function generateShortAmazonLink(
  amazonUrl: string,
  affiliateTag: string,
  marketplace: 'es' | 'de' | 'fr' | 'it' | 'co.uk' = 'es'
): string | null {
  const asin = extractAsin(amazonUrl);
  if (!asin) return null;
  
  return `https://www.amazon.${marketplace}/dp/${asin}?tag=${affiliateTag}`;
}

/**
 * Genera link de OneLink para redirección multi-país
 */
export function generateOneLinkUrl(
  amazonEsUrl: string,
  primaryTag: string
): string {
  // OneLink redirige automáticamente basándose en la ubicación del usuario
  // Solo necesitas el link de Amazon ES con tu tag
  const asin = extractAsin(amazonEsUrl);
  if (!asin) return amazonEsUrl;
  
  return `https://www.amazon.es/dp/${asin}?tag=${primaryTag}`;
}
