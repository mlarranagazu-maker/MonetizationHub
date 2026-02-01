// 🖥️ PcComponentes Campaign - Campañas de ofertas tech
// Publicación automática de ofertas de PcComponentes a Telegram

import { config } from 'dotenv';
import { logger } from './utils/logger.js';
import { 
  scrapePcComponentesOffers, 
  generateAffiliateLink,
  PcComponentesProduct,
  PC_CATEGORIES 
} from './providers/pccomponentes.js';

config();

// Configuración
const AFFILIATE_ID = process.env.PCCOMPONENTES_AFFILIATE_ID || '';
const MIN_DISCOUNT = parseInt(process.env.MIN_DISCOUNT || '15');
const MAX_PRODUCTS = parseInt(process.env.MAX_PRODUCTS || '8');
const CATEGORY = process.env.PC_CATEGORY || 'ofertas';

/**
 * Genera mensaje de campaña para Telegram
 */
function generateCampaignMessage(products: PcComponentesProduct[]): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  // Header
  let message = `🖥️🖥️🖥️ **OFERTAS PCCOMPONENTES** 🖥️🖥️🖥️\n\n`;
  message += `📅 *${dateStr}*\n`;
  message += `💻 Las mejores ofertas tech del día\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Productos
  products.forEach((product, index) => {
    const affiliateLink = generateAffiliateLink(product.url, AFFILIATE_ID);
    const discountBadge = product.discount ? `🔥 -${product.discount}%` : '';
    const stockBadge = product.inStock ? '✅' : '⚠️';
    
    message += `**${index + 1}. ${product.name}**\n`;
    
    if (product.originalPrice) {
      message += `💰 ~${product.originalPrice}€~ → **${product.price}€** ${discountBadge}\n`;
    } else {
      message += `💰 **${product.price}€**\n`;
    }
    
    message += `${stockBadge} ${product.category}\n`;
    message += `🔗 [Ver oferta](${affiliateLink})\n\n`;
  });
  
  // Footer
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `🛒 *Ofertas verificadas de PcComponentes*\n`;
  message += `💡 ¡Los precios pueden cambiar sin previo aviso!\n`;
  message += `\n#PcComponentes #Ofertas #Tech #Gaming`;
  
  return message;
}

/**
 * Envía mensaje a Telegram
 */
async function sendToTelegram(message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !chatId) {
    throw new Error('Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHANNEL_ID');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error Telegram: ${error}`);
  }
}

/**
 * Main
 */
async function main() {
  logger.info('🖥️ Iniciando Campaña PcComponentes...\n');
  
  // Validar configuración
  if (!AFFILIATE_ID) {
    logger.warn('⚠️ PCCOMPONENTES_AFFILIATE_ID no configurado');
    logger.info('💡 Usando enlaces sin ID de afiliado (para testing)');
  }
  
  try {
    // 1. Obtener ofertas
    logger.info(`📂 Categoría: ${CATEGORY}`);
    logger.info(`📉 Descuento mínimo: ${MIN_DISCOUNT}%`);
    logger.info(`📦 Máx productos: ${MAX_PRODUCTS}\n`);
    
    const products = await scrapePcComponentesOffers({
      affiliateId: AFFILIATE_ID,
      minDiscount: MIN_DISCOUNT,
      maxProducts: MAX_PRODUCTS,
      categories: [CATEGORY],
    });
    
    if (products.length === 0) {
      logger.warn('⚠️ No se encontraron ofertas con los criterios especificados');
      return;
    }
    
    // 2. Generar mensaje
    logger.info('✍️ Generando mensaje de campaña...');
    const message = generateCampaignMessage(products);
    
    // 3. Enviar a Telegram
    logger.info('📤 Enviando a Telegram...');
    await sendToTelegram(message);
    
    // 4. Log de productos enviados
    logger.info('\n📦 Productos publicados:');
    products.forEach((p, i) => {
      const discount = p.discount ? ` (-${p.discount}%)` : '';
      logger.info(`   ${i + 1}. ${p.name.substring(0, 50)}... - ${p.price}€${discount}`);
    });
    
    logger.success(`\n🎉 ¡Campaña PcComponentes completada! ${products.length} ofertas publicadas`);
    
  } catch (error) {
    logger.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
