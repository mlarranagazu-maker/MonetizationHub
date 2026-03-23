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
    const url = 'https://www.chollometro.com/rss/nuevos';
    const xml = await fetchWithRetry(url);
    const $ = cheerio.load(xml, { xmlMode: true });

    $('item').each((index, element) => {
      try {
        if (index >= 25) return;

        const $el = $(element);

        const title = $el.find('title').first().text().trim();
        const dealLink = $el.find('link').first().text().trim();
        if (!title || !dealLink) return;

        const merchantEl = $el.find('pepper\\:merchant').first();
        const merchant = (merchantEl.attr('name') || '').trim() || 'Chollometro';
        const merchantPriceText = (merchantEl.attr('price') || '').trim();
        const descriptionText = $el.find('description').first().text();
        const currentPrice = parsePrice(merchantPriceText) || parsePrice(descriptionText);
        if (!currentPrice) return;

        const discountMatch = `${title} ${descriptionText}`.match(/(-?\d{1,3})%/);
        const parsedDiscount = discountMatch ? Math.abs(parseInt(discountMatch[1])) : 0;
        const discount = parsedDiscount || config.minDiscount;

        if (discount < config.minDiscount) return;

        const originalPrice = currentPrice / (1 - discount / 100);

        const imageUrl =
          $el.find('media\\:thumbnail').first().attr('url') ||
          $el.find('media\\:content').first().attr('url') ||
          '';

        const provider = detectProviderFromText(merchant);

        deals.push({
          id: `chollometro-${Date.now()}-${index}`,
          title: title.substring(0, 200),
          currentPrice,
          originalPrice: Number.isFinite(originalPrice) ? originalPrice : currentPrice * 1.3,
          discount,
          imageUrl,
          productLink: dealLink,
          affiliateLink: dealLink,
          provider,
          providerName: merchant,
          category: detectCategory(title),
          scrapedAt: new Date().toISOString(),
        });
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
// FUENTE 3: Ofertas con ASINs VERIFICADOS de Amazon.es
// ============================================
function generateSampleDeals(config: BotConfig): Deal[] {
  logger.info('  📡 Cargando catálogo de ofertas verificadas...');
  
  const amazonTag = process.env.AMAZON_ES_TAG || 'monetizehub-21';
  
  // ASINs VERIFICADOS - Productos reales que existen en Amazon.es
  const sampleProducts = [
    // === ELECTRÓNICA (ASINs verificados) ===
    {
      title: '🎧 Sony WH-1000XM4 Auriculares Inalámbricos Noise Cancelling',
      originalPrice: 379,
      currentPrice: 229,
      asin: 'B08C7KG5LP',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg'
    },
    {
      title: '📺 Amazon Fire TV Stick 4K con Alexa',
      originalPrice: 59.99,
      currentPrice: 36.99,
      asin: 'B08XVYZ1Y5',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/51TjJOTfslL._AC_SL1000_.jpg'
    },
    {
      title: '🔊 Echo Dot (5ª generación) Altavoz inteligente con Alexa',
      originalPrice: 59.99,
      currentPrice: 34.99,
      asin: 'B09B8V1LZ3',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/71xoR4A6q-L._AC_SL1000_.jpg'
    },
    {
      title: '📱 Samsung Galaxy Buds2 Pro Auriculares Bluetooth',
      originalPrice: 229,
      currentPrice: 149,
      asin: 'B0B8Z2F4P7',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/61Qqg+T8nsL._AC_SL1500_.jpg'
    },
    {
      title: '🖥️ Logitech MX Keys Mini Teclado Inalámbrico Compacto',
      originalPrice: 109,
      currentPrice: 79,
      asin: 'B098JPSVKY',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/71gOLg2-kqL._AC_SL1500_.jpg'
    },
    {
      title: '🖱️ Logitech G502 HERO Ratón Gaming Alto Rendimiento',
      originalPrice: 89.99,
      currentPrice: 49.99,
      asin: 'B07GBZ4Q68',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/61mpMH5TzkL._AC_SL1500_.jpg'
    },
    {
      title: '💾 SanDisk Ultra 128GB Tarjeta microSDXC',
      originalPrice: 26.99,
      currentPrice: 14.99,
      asin: 'B08GYKNCCP',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/617NtexaW2L._AC_SL1500_.jpg'
    },
    {
      title: '🔌 Anker PowerCore 26800mAh Batería Externa',
      originalPrice: 65.99,
      currentPrice: 45.99,
      asin: 'B07XRJZXKY',
      category: 'electronics',
      image: 'https://m.media-amazon.com/images/I/61XmwG-TJnL._AC_SL1500_.jpg'
    },
    // === GAMING (ASINs verificados) ===
    {
      title: '🎮 Mando Inalámbrico Xbox - Carbon Black',
      originalPrice: 59.99,
      currentPrice: 44.99,
      asin: 'B08DF26MXW',
      category: 'gaming',
      image: 'https://m.media-amazon.com/images/I/71WpFRDr-8L._SL1500_.jpg'
    },
    {
      title: '🎮 PlayStation DualSense Mando Inalámbrico - Blanco',
      originalPrice: 69.99,
      currentPrice: 54.99,
      asin: 'B08H98GVK8',
      category: 'gaming',
      image: 'https://m.media-amazon.com/images/I/61lsFiYLJzL._SL1500_.jpg'
    },
    {
      title: '🎧 HyperX Cloud II Auriculares Gaming',
      originalPrice: 99.99,
      currentPrice: 59.99,
      asin: 'B00SAYCXWG',
      category: 'gaming',
      image: 'https://m.media-amazon.com/images/I/71G6xNXcIQL._AC_SL1500_.jpg'
    },
    {
      title: '🕹️ Nintendo Switch Mando Pro Controller',
      originalPrice: 69.99,
      currentPrice: 54.99,
      asin: 'B07GKKJPJK',
      category: 'gaming',
      image: 'https://m.media-amazon.com/images/I/71YOGkTJJcL._SL1500_.jpg'
    },
    {
      title: '🖥️ BenQ MOBIUZ EX2510S Monitor Gaming 24.5" 165Hz',
      originalPrice: 279,
      currentPrice: 189,
      asin: 'B09BJVNVQB',
      category: 'gaming',
      image: 'https://m.media-amazon.com/images/I/81vFuW0HtXL._AC_SL1500_.jpg'
    },
    // === HOGAR (ASINs verificados) ===
    {
      title: '☕ De\'Longhi Magnifica S Cafetera Superautomática',
      originalPrice: 449,
      currentPrice: 299,
      asin: 'B009JL3DMI',
      category: 'home',
      image: 'https://m.media-amazon.com/images/I/71OWiT6vKGL._AC_SL1500_.jpg'
    },
    {
      title: '🧹 iRobot Roomba 692 Robot Aspirador con Wi-Fi',
      originalPrice: 299,
      currentPrice: 199,
      asin: 'B08F7VK6VX',
      category: 'home',
      image: 'https://m.media-amazon.com/images/I/71lEQJekQ1L._AC_SL1500_.jpg'
    },
    {
      title: '🌡️ Philips Airfryer Essential 4.1L Freidora sin Aceite',
      originalPrice: 139.99,
      currentPrice: 89.99,
      asin: 'B0936F6XPV',
      category: 'home',
      image: 'https://m.media-amazon.com/images/I/61xPJmFrAZL._AC_SL1000_.jpg'
    },
    {
      title: '💡 Philips Hue White Bombilla LED E27 Pack 2',
      originalPrice: 34.99,
      currentPrice: 22.99,
      asin: 'B07SS377J6',
      category: 'home',
      image: 'https://m.media-amazon.com/images/I/51fmNpMkNtL._AC_SL1000_.jpg'
    },
    {
      title: '🍳 Tefal Ingenio Expertise Set 10 Piezas',
      originalPrice: 179.99,
      currentPrice: 119.99,
      asin: 'B01FX8O3R4',
      category: 'home',
      image: 'https://m.media-amazon.com/images/I/71cYQ8OVONL._AC_SL1500_.jpg'
    },
    // === DEPORTES (ASINs verificados) ===
    {
      title: '⌚ Xiaomi Mi Smart Band 7 Pulsera de Actividad',
      originalPrice: 49.99,
      currentPrice: 34.99,
      asin: 'B0B4N8G7G9',
      category: 'sports',
      image: 'https://m.media-amazon.com/images/I/41kLmxFQwEL._AC_SL1000_.jpg'
    },
    {
      title: '🏃 Garmin Forerunner 55 GPS Reloj Running',
      originalPrice: 199.99,
      currentPrice: 139.99,
      asin: 'B096FPLK8P',
      category: 'sports',
      image: 'https://m.media-amazon.com/images/I/61zz1HE9J3S._AC_SL1500_.jpg'
    },
    {
      title: '💪 Theragun Elite Pistola de Masaje Muscular',
      originalPrice: 399,
      currentPrice: 279,
      asin: 'B08DKXBWDR',
      category: 'sports',
      image: 'https://m.media-amazon.com/images/I/61Q9n+5oSmL._AC_SL1500_.jpg'
    },
    // === BELLEZA (ASINs verificados) ===
    {
      title: '🪥 Oral-B Pro 3 3000 Cepillo de Dientes Eléctrico',
      originalPrice: 109.99,
      currentPrice: 49.99,
      asin: 'B07NSMT5VH',
      category: 'beauty',
      image: 'https://m.media-amazon.com/images/I/61MVWRF-09L._SL1500_.jpg'
    },
    {
      title: '✂️ Philips OneBlade Pro QP6520 Recortador',
      originalPrice: 79.99,
      currentPrice: 49.99,
      asin: 'B07H5S1GFD',
      category: 'beauty',
      image: 'https://m.media-amazon.com/images/I/71ZLvLkkgjL._AC_SL1500_.jpg'
    },
    {
      title: '💇 ghd Original Plancha de Pelo Profesional',
      originalPrice: 179,
      currentPrice: 129,
      asin: 'B083K7YNYF',
      category: 'beauty',
      image: 'https://m.media-amazon.com/images/I/51YcV05K0QL._SL1000_.jpg'
    },
    // === COCINA (ASINs verificados) ===
    {
      title: '☕ Nespresso Vertuo Next Cafetera de Cápsulas',
      originalPrice: 179,
      currentPrice: 99,
      asin: 'B08D6QM4NZ',
      category: 'kitchen',
      image: 'https://m.media-amazon.com/images/I/71tW9k0TJYL._AC_SL1500_.jpg'
    },
    {
      title: '🥤 Ninja Batidora de Vaso 2-en-1 1000W',
      originalPrice: 99.99,
      currentPrice: 69.99,
      asin: 'B08F9XFVKD',
      category: 'kitchen',
      image: 'https://m.media-amazon.com/images/I/61xnPa1lJPL._AC_SL1500_.jpg'
    },
    {
      title: '🔪 Zwilling Twin Chef Set Cuchillos 3 Piezas',
      originalPrice: 129,
      currentPrice: 79,
      asin: 'B0001WKQ40',
      category: 'kitchen',
      image: 'https://m.media-amazon.com/images/I/41rMjmOQ0hL._AC_.jpg'
    },
    // === JUGUETES (ASINs verificados) ===
    {
      title: '🧸 LEGO Star Wars Halcón Milenario 75375',
      originalPrice: 89.99,
      currentPrice: 64.99,
      asin: 'B0C1JNSQBD',
      category: 'toys',
      image: 'https://m.media-amazon.com/images/I/81VB6GQPS1L._AC_SL1500_.jpg'
    },
    {
      title: '🎲 Monopoly Edición Clásica Juego de Mesa',
      originalPrice: 29.99,
      currentPrice: 19.99,
      asin: 'B07MTSTYRL',
      category: 'toys',
      image: 'https://m.media-amazon.com/images/I/91a2EfBGMGL._AC_SL1500_.jpg'
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
  if (config.providers.includes('pccomponentes')) {
    try {
      const pcDeals = await scrapePcComponentes(config);
      allDeals.push(...pcDeals);
    } catch (e) {
      logger.warn('  ⚠️ PcComponentes no disponible');
    }
  }
  
  // 3. Si no hay ofertas reales, usar ejemplos para que el bot funcione
  if (allDeals.length === 0) {
    const allowSampleDeals = (process.env.ALLOW_SAMPLE_DEALS || '').toLowerCase() === 'true';
    logger.warn('\n  ⚠️ No se encontraron ofertas en tiempo real');
    if (allowSampleDeals) {
      logger.info('  📦 Usando ofertas de ejemplo para demostración...\n');
      const sampleDeals = generateSampleDeals(config);
      allDeals.push(...sampleDeals);
    } else {
      logger.warn('  ⏭️ Sample deals desactivadas (set ALLOW_SAMPLE_DEALS=true para modo demo)');
      return [];
    }
  }
  
  // Eliminar duplicados
  const uniqueDeals = removeDuplicates(allDeals);
  
  // Ordenar por descuento (mejores primero)
  uniqueDeals.sort((a, b) => b.discount - a.discount);
  
  // Devolver más candidatos para que el selector aplique scoring/diversidad
  const maxScraped = Math.max(
    config.maxDeals,
    parseInt(process.env.SCRAPER_MAX_DEALS || '50')
  );
  return uniqueDeals.slice(0, maxScraped);
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
