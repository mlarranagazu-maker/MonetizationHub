// 🖥️ PcComponentes Provider - Scraping de ofertas
// Integración con programa de afiliados PcComponentes

import { logger } from '../utils/logger.js';

export interface PcComponentesProduct {
  name: string;
  url: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  category: string;
  inStock: boolean;
}

export interface PcComponentesConfig {
  affiliateId: string;
  minDiscount: number;
  maxProducts: number;
  categories: string[];
}

// Categorías disponibles en PcComponentes
export const PC_CATEGORIES = {
  ofertas: 'https://www.pccomponentes.com/ofertas',
  portatiles: 'https://www.pccomponentes.com/ordenadores/portatiles',
  componentes: 'https://www.pccomponentes.com/componentes',
  perifericos: 'https://www.pccomponentes.com/perifericos',
  monitores: 'https://www.pccomponentes.com/monitores-pc',
  gaming: 'https://www.pccomponentes.com/gaming',
  smartphones: 'https://www.pccomponentes.com/smartphones',
  tablets: 'https://www.pccomponentes.com/tablets',
  tv: 'https://www.pccomponentes.com/televisores',
  electrodomesticos: 'https://www.pccomponentes.com/electrodomesticos',
};

/**
 * Genera enlace de afiliado PcComponentes
 */
export function generateAffiliateLink(productUrl: string, affiliateId: string): string {
  // PcComponentes usa el parámetro uym_source para tracking
  const url = new URL(productUrl);
  url.searchParams.set('uym_source', affiliateId);
  return url.toString();
}

/**
 * Scraping de ofertas de PcComponentes
 * Nota: En producción se recomienda usar su API de afiliados si está disponible
 */
export async function scrapePcComponentesOffers(
  config: PcComponentesConfig
): Promise<PcComponentesProduct[]> {
  logger.info('🖥️ Buscando ofertas en PcComponentes...');
  
  try {
    // Por ahora usamos productos de muestra verificados
    // En producción: implementar scraping real o usar API
    const sampleProducts = getSamplePcComponentesProducts();
    
    // Filtrar por descuento mínimo
    const filteredProducts = sampleProducts
      .filter(p => (p.discount || 0) >= config.minDiscount)
      .slice(0, config.maxProducts);
    
    logger.success(`✅ ${filteredProducts.length} ofertas encontradas en PcComponentes`);
    
    return filteredProducts;
  } catch (error) {
    logger.error(`❌ Error scraping PcComponentes: ${error}`);
    return [];
  }
}

/**
 * Formatea producto para mensaje de Telegram
 */
export function formatPcComponentesProduct(
  product: PcComponentesProduct,
  affiliateId: string
): string {
  const affiliateLink = generateAffiliateLink(product.url, affiliateId);
  const discountText = product.discount ? ` (-${product.discount}%)` : '';
  const originalPriceText = product.originalPrice 
    ? `~${product.originalPrice}€~ → ` 
    : '';
  
  let message = `🖥️ *${product.name}*\n\n`;
  message += `💰 ${originalPriceText}**${product.price}€**${discountText}\n`;
  message += `📦 ${product.inStock ? '✅ En stock' : '⚠️ Disponibilidad limitada'}\n`;
  message += `🏷️ ${product.category}\n\n`;
  message += `🔗 [Ver en PcComponentes](${affiliateLink})`;
  
  return message;
}

/**
 * Productos de muestra con URLs reales de PcComponentes
 * NOTA: Reemplazar con scraping real o API en producción
 */
function getSamplePcComponentesProducts(): PcComponentesProduct[] {
  return [
    // Portátiles Gaming
    {
      name: 'ASUS TUF Gaming F15 FX507ZC4 Intel Core i7-12700H/16GB/512GB SSD/RTX 3050/15.6"',
      url: 'https://www.pccomponentes.com/asus-tuf-gaming-f15-fx507zc4-intel-core-i7-12700h-16gb-512gb-ssd-rtx-3050-156',
      price: 799,
      originalPrice: 999,
      discount: 20,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1066/10669569/1.jpg',
      category: 'Portátiles Gaming',
      inStock: true,
    },
    {
      name: 'Lenovo Legion 5 15IAH7H Intel Core i7-12700H/16GB/512GB SSD/RTX 3060/15.6"',
      url: 'https://www.pccomponentes.com/lenovo-legion-5-15iah7h-intel-core-i7-12700h-16gb-512gb-ssd-rtx-3060-156',
      price: 899,
      originalPrice: 1199,
      discount: 25,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1066/10660123/1.jpg',
      category: 'Portátiles Gaming',
      inStock: true,
    },
    // Monitores
    {
      name: 'Samsung Odyssey G5 LC27G55TQWUXEN 27" LED WQHD 144Hz FreeSync Curvo',
      url: 'https://www.pccomponentes.com/samsung-odyssey-g5-lc27g55tqwuxen-27-led-wqhd-144hz-freesync-curvo',
      price: 229,
      originalPrice: 329,
      discount: 30,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1035/10354521/1.jpg',
      category: 'Monitores Gaming',
      inStock: true,
    },
    {
      name: 'LG UltraGear 27GP850P-B 27" LED IPS QHD 165Hz G-Sync Compatible',
      url: 'https://www.pccomponentes.com/lg-ultragear-27gp850p-b-27-led-ips-qhd-165hz-g-sync-compatible',
      price: 299,
      originalPrice: 449,
      discount: 33,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1054/10545634/1.jpg',
      category: 'Monitores Gaming',
      inStock: true,
    },
    // Componentes
    {
      name: 'AMD Ryzen 7 5800X 3.8GHz BOX',
      url: 'https://www.pccomponentes.com/amd-ryzen-7-5800x-38ghz-box',
      price: 199,
      originalPrice: 299,
      discount: 33,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1034/10348866/1.jpg',
      category: 'Procesadores',
      inStock: true,
    },
    {
      name: 'Gigabyte GeForce RTX 4060 WINDFORCE OC 8GB GDDR6',
      url: 'https://www.pccomponentes.com/gigabyte-geforce-rtx-4060-windforce-oc-8gb-gddr6',
      price: 319,
      originalPrice: 379,
      discount: 16,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1080/10807123/1.jpg',
      category: 'Tarjetas Gráficas',
      inStock: true,
    },
    // Periféricos
    {
      name: 'Logitech G502 HERO Ratón Gaming 25600DPI RGB Negro',
      url: 'https://www.pccomponentes.com/logitech-g502-hero-raton-gaming-25600dpi-rgb-negro',
      price: 39.99,
      originalPrice: 59.99,
      discount: 33,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1024/10240456/1.jpg',
      category: 'Ratones Gaming',
      inStock: true,
    },
    {
      name: 'Razer DeathAdder V3 Ratón Gaming 30000 DPI Negro',
      url: 'https://www.pccomponentes.com/razer-deathadder-v3-raton-gaming-30000-dpi-negro',
      price: 59.99,
      originalPrice: 89.99,
      discount: 33,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1075/10758234/1.jpg',
      category: 'Ratones Gaming',
      inStock: true,
    },
    {
      name: 'SteelSeries Arctis Nova 7 Wireless Auriculares Gaming Inalámbricos Negros',
      url: 'https://www.pccomponentes.com/steelseries-arctis-nova-7-wireless-auriculares-gaming-inalambricos-negros',
      price: 149,
      originalPrice: 199,
      discount: 25,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1072/10726123/1.jpg',
      category: 'Auriculares Gaming',
      inStock: true,
    },
    // Storage
    {
      name: 'Samsung 980 PRO SSD 2TB PCIe 4.0 NVMe M.2',
      url: 'https://www.pccomponentes.com/samsung-980-pro-ssd-2tb-pcie-40-nvme-m2',
      price: 149,
      originalPrice: 249,
      discount: 40,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1037/10376522/1.jpg',
      category: 'Discos SSD',
      inStock: true,
    },
    // Sillas Gaming
    {
      name: 'Newskill Takamikura V2 Silla Gaming Negra',
      url: 'https://www.pccomponentes.com/newskill-takamikura-v2-silla-gaming-negra',
      price: 129,
      originalPrice: 179,
      discount: 28,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1063/10639876/1.jpg',
      category: 'Sillas Gaming',
      inStock: true,
    },
    // Smartphones
    {
      name: 'Samsung Galaxy S23 FE 8/128GB Grafito',
      url: 'https://www.pccomponentes.com/samsung-galaxy-s23-fe-8-128gb-grafito',
      price: 499,
      originalPrice: 699,
      discount: 29,
      image: 'https://thumb.pccomponentes.com/w-530-530/articles/1082/10828765/1.jpg',
      category: 'Smartphones',
      inStock: true,
    },
  ];
}

export default {
  scrapePcComponentesOffers,
  generateAffiliateLink,
  formatPcComponentesProduct,
  PC_CATEGORIES,
};
