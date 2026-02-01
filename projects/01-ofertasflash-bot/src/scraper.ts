// Scraper MEJORADO - Múltiples fuentes de ofertas
// Estrategia: Chollometro + CamelCamelCamel + PcComponentes + Fallback

import * as cheerio from 'cheerio';
import { Deal, BotConfig } from './types.js';
import { logger } from './utils/logger.js';

// User agents rotativos para evitar bloqueos
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Headers mejorados para evitar detección
 */
function getHeaders(): Record<string, string> {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };
}

/**
 * Fetch con retry y delay aleatorio
 */
async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      // Delay aleatorio entre 1-3 segundos
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      
      const response = await fetch(url, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(20000)
      });
      
      if (response.status === 503 || response.status === 429) {
        logger.warn(`  ⚠️ Rate limited, esperando...`);
        await new Promise(r => setTimeout(r, 5000 * (i + 1)));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      if (i === retries - 1) throw error;
      logger.debug(`  Reintento ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// ============================================
// FUENTE 1: Chollometro (Comunidad de ofertas española)
// ============================================
async function scrapeChollometro(config: BotConfig): Promise<Deal[]> {
  logger.info('  📡 Scraping Chollometro (ofertas verificadas)...');
  const deals: Deal[] = [];
  
  try {
    const url = 'https://www.chollometro.com/hot?hide_expired=true';
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);
    
    // Buscar ofertas en el feed
    $('article[class*="thread"]').each((index, element) => {
      try {
        if (index >= 10) return;
        
        const $el = $(element);
        
        // Título
        const titleEl = $el.find('a[class*="thread-link"]').first();
        const title = titleEl.text().trim() || $el.find('strong').first().text().trim();
        if (!title || title.length < 10) return;
        
        // Link del deal
        const dealLink = titleEl.attr('href') || '';
        
        // Precio
        const priceEl = $el.find('span[class*="thread-price"]');
        const priceText = priceEl.text().trim();
        const currentPrice = parsePrice(priceText);
        
        // Precio original
        const originalPriceEl = $el.find('span[class*="mute--text"][class*="lineThrough"]');
        let originalPrice = parsePrice(originalPriceEl.text());
        if (!originalPrice && currentPrice) {
          originalPrice = currentPrice * 1.35; // Estimar 35% descuento si no hay precio original
        }
        
        // Calcular descuento
        let discount = 0;
        if (originalPrice && currentPrice && originalPrice > currentPrice) {
          discount = Math.round((1 - currentPrice / originalPrice) * 100);
        }
        
        // Si no hay precio, buscar descuento en texto
        if (!discount) {
          const discountMatch = $el.text().match(/(-?\d+)%/);
          if (discountMatch) {
            discount = Math.abs(parseInt(discountMatch[1]));
          }
        }
        
        if (discount < config.minDiscount && currentPrice === 0) return;
        
        // Imagen
        const imageUrl = $el.find('img[class*="thread-image"]').attr('src') || 
                        $el.find('img').first().attr('src') || '';
        
        // Detectar tienda
        const merchantEl = $el.find('a[class*="merchant"], span[class*="merchant"]');
        const merchant = merchantEl.text().trim() || 'Chollometro';
        
        // Detectar proveedor del link
        const provider = detectProviderFromUrl(dealLink) || detectProviderFromText(merchant);
        const affiliateLink = generateSmartAffiliateLink(dealLink, provider);
        
        const deal: Deal = {
          id: `chollometro-${Date.now()}-${index}`,
          title: title.substring(0, 200),
          currentPrice: currentPrice || 0,
          originalPrice: originalPrice || currentPrice * 1.3,
          discount: discount || 30,
          imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
          productLink: dealLink,
          affiliateLink,
          provider,
          providerName: merchant,
          category: detectCategory(title),
          scrapedAt: new Date().toISOString(),
        };
        
        deals.push(deal);
      } catch (err) {
        // Ignorar errores individuales
      }
    });
    
    logger.info(`    ✓ ${deals.length} ofertas de Chollometro`);
  } catch (error) {
    logger.error(`    ✗ Error Chollometro: ${error instanceof Error ? error.message : error}`);
  }
  
  return deals;
}

// ============================================
// FUENTE 2: PcComponentes (Ofertas tech)
// ============================================
async function scrapePcComponentes(config: BotConfig): Promise<Deal[]> {
  logger.info('  📡 Scraping PcComponentes...');
  const deals: Deal[] = [];
  
  try {
    const url = 'https://www.pccomponentes.com/ofertas';
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);
    
    $('article[data-id]').each((index, element) => {
      try {
        if (index >= 8) return;
        
        const $el = $(element);
        
        // Título
        const title = $el.find('h3').text().trim() || 
                     $el.attr('data-name') || '';
        if (!title) return;
        
        // Precio actual
        const priceAttr = $el.attr('data-price');
        const currentPrice = priceAttr ? parseFloat(priceAttr) : 
                            parsePrice($el.find('[data-product-price]').text());
        if (!currentPrice) return;
        
        // Precio original
        const originalPriceText = $el.find('.c-product-card__price--old').text() ||
                                  $el.find('[class*="original"]').text();
        const originalPrice = parsePrice(originalPriceText) || currentPrice * 1.25;
        
        // Descuento
        let discount = 0;
        if (originalPrice > currentPrice) {
          discount = Math.round((1 - currentPrice / originalPrice) * 100);
        }
        
        if (discount < config.minDiscount) return;
        
        // Link
        const link = $el.find('a').first().attr('href') || '';
        const fullLink = link.startsWith('http') ? link : `https://www.pccomponentes.com${link}`;
        
        // Imagen
        const imageUrl = $el.find('img').first().attr('src') || 
                        $el.find('img').first().attr('data-src') || '';
        
        // Affiliate link
        const affiliateTag = process.env.PCCOMPONENTES_TAG || '';
        const affiliateLink = affiliateTag ? 
          `${fullLink}${fullLink.includes('?') ? '&' : '?'}publicidadId=${affiliateTag}` : 
          fullLink;
        
        deals.push({
          id: `pccomponentes-${$el.attr('data-id') || Date.now()}-${index}`,
          title,
          currentPrice,
          originalPrice,
          discount,
          imageUrl,
          productLink: fullLink,
          affiliateLink,
          provider: 'pccomponentes',
          providerName: 'PcComponentes',
          category: 'electronics',
          scrapedAt: new Date().toISOString(),
        });
      } catch (err) {}
    });
    
    logger.info(`    ✓ ${deals.length} ofertas de PcComponentes`);
  } catch (error) {
    logger.error(`    ✗ Error PcComponentes: ${error instanceof Error ? error.message : error}`);
  }
  
  return deals;
}

// ============================================
// FUENTE 3: Ofertas de ejemplo (FALLBACK para testing)
// ============================================
function generateSampleDeals(config: BotConfig): Deal[] {
  logger.info('  📡 Usando ofertas de ejemplo para testing...');
  
  const amazonTag = process.env.AMAZON_ES_TAG || 'monetizehub-21';
  
  // Productos reales de Amazon con buenos descuentos típicos
  const sampleProducts = [
    {
      title: '🎧 Apple AirPods Pro (2ª generación) con estuche de carga MagSafe USB-C',
      originalPrice: 279,
      currentPrice: 199,
      asin: 'B0CHWRXH8B',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg'
    },
    {
      title: '🖱️ Logitech MX Master 3S - Ratón Inalámbrico Avanzado, Silencioso',
      originalPrice: 129,
      currentPrice: 79,
      asin: 'B0B17HNWFT',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg'
    },
    {
      title: '📱 Xiaomi Redmi Note 13 Pro 5G - 8GB RAM, 256GB, Cámara 200MP',
      originalPrice: 399,
      currentPrice: 259,
      asin: 'B0CTCQVHFJ',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/71dYHrRQ-lL._AC_SL1500_.jpg'
    },
    {
      title: '🎮 Mando Inalámbrico DualSense PS5 - Edición Midnight Black',
      originalPrice: 74.99,
      currentPrice: 49.99,
      asin: 'B08H99BPJN',
      category: 'gaming',
      image: 'https://m.media-amazon.com/images/I/61lsFiYLJzL._SL1500_.jpg'
    },
    {
      title: '📺 Fire TV Stick 4K Max (2ª gen) con Wi-Fi 6E y Alexa',
      originalPrice: 69.99,
      currentPrice: 42.99,
      asin: 'B0BXM37FQB',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/51CgKGfMelL._AC_SL1000_.jpg'
    },
    {
      title: '☕ Cecotec Cafetera Megautomática Power Matic-ccino 8000 Touch Serie Nera',
      originalPrice: 449,
      currentPrice: 289,
      asin: 'B08BFKWN5D',
      category: 'home',
      image: 'https://m.media-amazon.com/images/I/71bQF9pB7bL._AC_SL1500_.jpg'
    },
    {
      title: '🏃 Garmin Forerunner 255 - Reloj GPS Running con Métricas Avanzadas',
      originalPrice: 349.99,
      currentPrice: 229,
      asin: 'B0B5PBMTM6',
      category: 'sports',
      image: 'https://m.media-amazon.com/images/I/61X8Q0y8wHL._AC_SL1500_.jpg'
    },
  ];
  
  return sampleProducts
    .filter(p => {
      const discount = Math.round((1 - p.currentPrice / p.originalPrice) * 100);
      return discount >= config.minDiscount;
    })
    .slice(0, config.maxDeals)
    .map((product, index) => {
      const discount = Math.round((1 - product.currentPrice / product.originalPrice) * 100);
      return {
        id: `amazon-${product.asin}`,
        title: product.title,
        currentPrice: product.currentPrice,
        originalPrice: product.originalPrice,
        discount,
        imageUrl: product.image,
        productLink: `https://www.amazon.es/dp/${product.asin}`,
        affiliateLink: `https://www.amazon.es/dp/${product.asin}?tag=${amazonTag}`,
        provider: 'amazon_es',
        providerName: 'Amazon España',
        category: product.category,
        scrapedAt: new Date().toISOString(),
      };
    });
}

// ============================================
// FUNCIÓN PRINCIPAL: Multi-fuente con fallbacks
// ============================================
export async function scrapeMultiProvider(config: BotConfig): Promise<Deal[]> {
  const allDeals: Deal[] = [];
  
  logger.info('🔍 Iniciando scraping multi-fuente...\n');
  
  // 1. Chollometro - Mejor fuente (ofertas verificadas por comunidad)
  try {
    const chollometroDeals = await scrapeChollometro(config);
    allDeals.push(...chollometroDeals);
  } catch (e) {
    logger.warn('  ⚠️ Chollometro no disponible');
  }
  
  // Pausa entre fuentes
  await new Promise(r => setTimeout(r, 2000));
  
  // 2. PcComponentes - Tech
  if (config.providers.includes('pccomponentes') || config.categories.includes('electronics')) {
    try {
      const pcDeals = await scrapePcComponentes(config);
      allDeals.push(...pcDeals);
    } catch (e) {
      logger.warn('  ⚠️ PcComponentes no disponible');
    }
  }
  
  // 3. Si no hay ofertas reales, usar ejemplos para que el bot funcione
  if (allDeals.length === 0) {
    logger.warn('\n  ⚠️ No se encontraron ofertas en tiempo real');
    logger.info('  📦 Usando ofertas de ejemplo para demostración...\n');
    const sampleDeals = generateSampleDeals(config);
    allDeals.push(...sampleDeals);
  }
  
  // Eliminar duplicados
  const uniqueDeals = removeDuplicates(allDeals);
  
  // Ordenar por descuento (mejores primero)
  uniqueDeals.sort((a, b) => b.discount - a.discount);
  
  // Limitar al máximo configurado
  return uniqueDeals.slice(0, config.maxDeals);
}

// ============================================
// UTILIDADES
// ============================================

function parsePrice(text: string): number {
  if (!text) return 0;
  // Limpiar texto: quitar todo excepto números, comas y puntos
  const cleaned = text
    .replace(/[€$£]/g, '')
    .replace(/\s/g, '')
    .replace(/\.(\d{3})/g, '$1') // Quitar puntos de miles
    .replace(',', '.'); // Coma decimal a punto
  
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function detectCategory(title: string): string {
  const lower = title.toLowerCase();
  
  const categories: Record<string, string[]> = {
    'electronics': ['iphone', 'samsung', 'xiaomi', 'huawei', 'auriculares', 'airpods', 'tablet', 'portátil', 'laptop', 'ratón', 'teclado', 'monitor', 'tv', 'televisor', 'smartphone', 'móvil', 'cargador', 'usb', 'cable', 'ssd', 'disco'],
    'gaming': ['gaming', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch', 'consola', 'mando', 'playstation', 'rtx', 'gpu', 'gamer', 'rgb'],
    'home': ['hogar', 'cocina', 'aspirador', 'robot', 'freidora', 'cafetera', 'microondas', 'nevera', 'lavadora', 'horno', 'batidora'],
    'sports': ['deporte', 'fitness', 'running', 'bicicleta', 'zapatillas', 'decathlon', 'garmin', 'reloj', 'gym', 'pesas'],
    'fashion': ['moda', 'ropa', 'camiseta', 'pantalón', 'vestido', 'zapatos', 'nike', 'adidas', 'puma', 'zara'],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  
  return 'general';
}

function detectProviderFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('amazon.es')) return 'amazon_es';
  if (lower.includes('amazon.de')) return 'amazon_de';
  if (lower.includes('amazon.fr')) return 'amazon_fr';
  if (lower.includes('amazon.it')) return 'amazon_it';
  if (lower.includes('amazon.co.uk')) return 'amazon_uk';
  if (lower.includes('amazon.')) return 'amazon';
  if (lower.includes('pccomponentes')) return 'pccomponentes';
  if (lower.includes('elcorteingles')) return 'elcorteingles';
  if (lower.includes('mediamarkt')) return 'mediamarkt';
  if (lower.includes('decathlon')) return 'decathlon';
  if (lower.includes('aliexpress')) return 'aliexpress';
  if (lower.includes('miravia')) return 'miravia';
  if (lower.includes('zalando')) return 'zalando';
  return 'other';
}

function detectProviderFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('amazon')) return 'amazon_es';
  if (lower.includes('pccomponentes') || lower.includes('pc componentes')) return 'pccomponentes';
  if (lower.includes('corte inglés') || lower.includes('eci')) return 'elcorteingles';
  if (lower.includes('mediamarkt') || lower.includes('media markt')) return 'mediamarkt';
  if (lower.includes('decathlon')) return 'decathlon';
  if (lower.includes('aliexpress')) return 'aliexpress';
  return 'other';
}

function generateSmartAffiliateLink(url: string, provider: string): string {
  // Amazon - añadir tag de afiliado
  if (provider.startsWith('amazon')) {
    const tagMap: Record<string, string> = {
      amazon_es: process.env.AMAZON_ES_TAG || 'monetizehub-21',
      amazon_de: process.env.AMAZON_DE_TAG || '',
      amazon_fr: process.env.AMAZON_FR_TAG || '',
      amazon_it: process.env.AMAZON_IT_TAG || '',
      amazon_uk: process.env.AMAZON_UK_TAG || '',
      amazon: process.env.AMAZON_ES_TAG || 'monetizehub-21',
    };
    
    const tag = tagMap[provider] || tagMap['amazon_es'];
    if (!tag) return url;
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('tag', tag);
      return urlObj.toString();
    } catch {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}tag=${tag}`;
    }
  }
  
  // Awin (El Corte Inglés, Decathlon, etc.)
  if (['elcorteingles', 'decathlon', 'mediamarkt', 'zalando'].includes(provider)) {
    const awinId = process.env.AWIN_PUBLISHER_ID;
    if (awinId) {
      const merchantIds: Record<string, string> = {
        elcorteingles: '15019',
        decathlon: '12189',
        mediamarkt: '14469',
        zalando: '9528',
      };
      const mid = merchantIds[provider];
      if (mid) {
        return `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${awinId}&ued=${encodeURIComponent(url)}`;
      }
    }
  }
  
  // Si no hay afiliación, devolver URL original
  return url;
}

function removeDuplicates(deals: Deal[]): Deal[] {
  const seen = new Set<string>();
  return deals.filter(deal => {
    // Crear key normalizada del título
    const key = deal.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .substring(0, 40)
      .trim();
    
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Exports
export { scrapeChollometro, scrapePcComponentes, generateSampleDeals };
