// Scraper de ofertas multi-proveedor
// Soporta: Amazon ES/DE/FR, El Corte Inglés, Decathlon, PcComponentes

import * as cheerio from 'cheerio';
import { Deal, BotConfig, Provider } from './types';

// Configuración de proveedores
const PROVIDERS: Record<string, Provider> = {
  amazon_es: {
    name: 'Amazon España',
    baseUrl: 'https://www.amazon.es',
    dealsUrl: 'https://www.amazon.es/gp/goldbox',
    affiliateTag: process.env.AMAZON_ES_TAG || 'tuafiliado-21',
    selectors: {
      dealContainer: '[data-testid="deal-card"]',
      title: '.DealContent-module__truncate_sWbxETx42ZPStTc9jwySW',
      currentPrice: '.a-price .a-offscreen',
      originalPrice: '.a-text-price .a-offscreen',
      discount: '.savingsPercentage',
      image: 'img.DealContent-module__dealImage',
      link: 'a.DealContent-module__dealLink',
      timeLeft: '.Badge-module__badgeContent'
    }
  },
  amazon_de: {
    name: 'Amazon Alemania',
    baseUrl: 'https://www.amazon.de',
    dealsUrl: 'https://www.amazon.de/gp/goldbox',
    affiliateTag: process.env.AMAZON_DE_TAG || 'tuafiliado-21',
    selectors: {
      dealContainer: '[data-testid="deal-card"]',
      title: '.DealContent-module__truncate_sWbxETx42ZPStTc9jwySW',
      currentPrice: '.a-price .a-offscreen',
      originalPrice: '.a-text-price .a-offscreen',
      discount: '.savingsPercentage',
      image: 'img.DealContent-module__dealImage',
      link: 'a.DealContent-module__dealLink'
    }
  },
  amazon_fr: {
    name: 'Amazon Francia',
    baseUrl: 'https://www.amazon.fr',
    dealsUrl: 'https://www.amazon.fr/gp/goldbox',
    affiliateTag: process.env.AMAZON_FR_TAG || 'tuafiliado-21',
    selectors: {
      dealContainer: '[data-testid="deal-card"]',
      title: '.DealContent-module__truncate_sWbxETx42ZPStTc9jwySW',
      currentPrice: '.a-price .a-offscreen',
      originalPrice: '.a-text-price .a-offscreen',
      discount: '.savingsPercentage'
    }
  },
  elcorteingles: {
    name: 'El Corte Inglés',
    baseUrl: 'https://www.elcorteingles.es',
    dealsUrl: 'https://www.elcorteingles.es/ofertas/',
    affiliateNetwork: 'awin',
    awinId: '15019',
    selectors: {
      dealContainer: '.product-preview',
      title: '.product-preview__title',
      currentPrice: '.price--current',
      originalPrice: '.price--original',
      discount: '.discount-badge',
      image: '.product-preview__image img',
      link: 'a.product-preview__link'
    }
  },
  decathlon: {
    name: 'Decathlon',
    baseUrl: 'https://www.decathlon.es',
    dealsUrl: 'https://www.decathlon.es/es/browse/c0-todos-los-deportes/_/N-1j8zj4u?Nf=price_discountRate%7CGT+20',
    affiliateNetwork: 'awin',
    awinId: '12189',
    selectors: {
      dealContainer: '.product-item',
      title: '.product-title',
      currentPrice: '.price--current',
      originalPrice: '.price--strikethrough',
      discount: '.discount-percentage',
      image: '.product-image img',
      link: 'a.product-link'
    }
  },
  pccomponentes: {
    name: 'PcComponentes',
    baseUrl: 'https://www.pccomponentes.com',
    dealsUrl: 'https://www.pccomponentes.com/ofertas',
    affiliateTag: process.env.PCCOMPONENTES_TAG || '',
    selectors: {
      dealContainer: '.product-card',
      title: '.product-card__title',
      currentPrice: '.product-card__price',
      originalPrice: '.product-card__price--original',
      discount: '.product-card__discount',
      image: '.product-card__image img',
      link: 'a.product-card__link'
    }
  }
};

// Headers para evitar bloqueos
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'max-age=0'
};

/**
 * Scrape ofertas de Amazon España
 */
export async function scrapeAmazonDeals(config: BotConfig): Promise<Deal[]> {
  const provider = PROVIDERS.amazon_es;
  return scrapeProvider('amazon_es', provider, config);
}

/**
 * Scrape múltiples proveedores
 */
export async function scrapeMultiProvider(config: BotConfig): Promise<Deal[]> {
  const allDeals: Deal[] = [];
  
  for (const providerId of config.providers) {
    const provider = PROVIDERS[providerId];
    if (!provider) {
      console.warn(`⚠️ Proveedor desconocido: ${providerId}`);
      continue;
    }
    
    try {
      console.log(`  📡 Scrapeando ${provider.name}...`);
      const deals = await scrapeProvider(providerId, provider, config);
      allDeals.push(...deals);
      console.log(`  ✓ ${deals.length} ofertas de ${provider.name}`);
    } catch (error) {
      console.error(`  ✗ Error en ${provider.name}:`, error);
    }
    
    // Delay entre proveedores para no saturar
    await delay(1000);
  }
  
  // Ordenar por descuento (mayor primero)
  return allDeals.sort((a, b) => b.discount - a.discount);
}

/**
 * Scrape un proveedor específico
 */
async function scrapeProvider(
  providerId: string, 
  provider: Provider, 
  config: BotConfig
): Promise<Deal[]> {
  const deals: Deal[] = [];
  
  try {
    const response = await fetch(provider.dealsUrl, { headers: HEADERS });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $(provider.selectors.dealContainer).each((_, element) => {
      try {
        const $el = $(element);
        
        // Extraer datos
        const title = cleanText($el.find(provider.selectors.title).text());
        const currentPriceText = $el.find(provider.selectors.currentPrice).text();
        const originalPriceText = $el.find(provider.selectors.originalPrice).text();
        const discountText = $el.find(provider.selectors.discount).text();
        const imageUrl = $el.find(provider.selectors.image).attr('src') || '';
        const productLink = $el.find(provider.selectors.link).attr('href') || '';
        const timeLeft = provider.selectors.timeLeft 
          ? $el.find(provider.selectors.timeLeft).text() 
          : undefined;
        
        // Parsear precios
        const currentPrice = parsePrice(currentPriceText);
        const originalPrice = parsePrice(originalPriceText);
        const discount = parseDiscount(discountText) || 
          calculateDiscount(originalPrice, currentPrice);
        
        // Filtrar por descuento mínimo
        if (discount < config.minDiscount) return;
        
        // Generar link de afiliado
        const affiliateLink = generateAffiliateLink(
          productLink, 
          provider, 
          providerId
        );
        
        if (title && currentPrice > 0 && affiliateLink) {
          deals.push({
            id: generateDealId(providerId, productLink),
            title,
            currentPrice,
            originalPrice,
            discount,
            imageUrl: normalizeImageUrl(imageUrl, provider.baseUrl),
            productLink: normalizeUrl(productLink, provider.baseUrl),
            affiliateLink,
            provider: providerId,
            providerName: provider.name,
            category: detectCategory(title),
            timeLeft: cleanText(timeLeft || ''),
            scrapedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        // Ignorar elementos mal formados
      }
    });
    
  } catch (error) {
    console.error(`Error scrapeando ${provider.name}:`, error);
  }
  
  return deals;
}

/**
 * Genera link de afiliado según el proveedor
 */
function generateAffiliateLink(
  productLink: string, 
  provider: Provider, 
  providerId: string
): string {
  const fullUrl = normalizeUrl(productLink, provider.baseUrl);
  
  // Amazon: añadir tag
  if (providerId.startsWith('amazon')) {
    const url = new URL(fullUrl);
    url.searchParams.set('tag', provider.affiliateTag || '');
    return url.toString();
  }
  
  // Awin: usar deeplink
  if (provider.affiliateNetwork === 'awin' && provider.awinId) {
    const publisherId = process.env.AWIN_PUBLISHER_ID || '';
    const encodedUrl = encodeURIComponent(fullUrl);
    return `https://www.awin1.com/cread.php?awinmid=${provider.awinId}&awinaffid=${publisherId}&ued=${encodedUrl}`;
  }
  
  // PcComponentes u otros
  if (provider.affiliateTag) {
    const url = new URL(fullUrl);
    url.searchParams.set('ref', provider.affiliateTag);
    return url.toString();
  }
  
  return fullUrl;
}

// Funciones auxiliares
function cleanText(text: string): string {
  return text?.trim().replace(/\s+/g, ' ') || '';
}

function parsePrice(priceText: string): number {
  const match = priceText.match(/[\d,.]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace('.', '').replace(',', '.'));
}

function parseDiscount(discountText: string): number {
  const match = discountText.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function calculateDiscount(original: number, current: number): number {
  if (original <= 0 || current <= 0) return 0;
  return Math.round(((original - current) / original) * 100);
}

function normalizeUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return baseUrl + url;
  return baseUrl + '/' + url;
}

function normalizeImageUrl(url: string, baseUrl: string): string {
  const normalized = normalizeUrl(url, baseUrl);
  // Amazon: obtener imagen de mayor calidad
  return normalized.replace(/\._.*_\./, '._SL500_.');
}

function generateDealId(provider: string, link: string): string {
  const hash = link.split('/').pop()?.split('?')[0] || Date.now().toString();
  return `${provider}_${hash}`;
}

function detectCategory(title: string): string {
  const titleLower = title.toLowerCase();
  const categories: Record<string, string[]> = {
    'electronics': ['tv', 'televisor', 'monitor', 'ordenador', 'portátil', 'laptop', 'tablet', 'ipad', 'smartphone', 'móvil', 'auriculares', 'altavoz'],
    'gaming': ['ps5', 'playstation', 'xbox', 'nintendo', 'gaming', 'videojuego', 'mando', 'controller'],
    'home': ['hogar', 'cocina', 'aspirador', 'robot', 'freidora', 'cafetera', 'microondas'],
    'fashion': ['ropa', 'zapatillas', 'zapatos', 'camiseta', 'pantalón', 'vestido', 'bolso'],
    'sports': ['deporte', 'fitness', 'running', 'bicicleta', 'pesas', 'yoga'],
    'beauty': ['belleza', 'cosmética', 'perfume', 'maquillaje', 'crema'],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => titleLower.includes(kw))) {
      return category;
    }
  }
  
  return 'general';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { PROVIDERS };
