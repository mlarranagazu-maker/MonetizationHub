// Cliente Telegram Bot con Telegraf
// Envío de ofertas a canal/grupo

import { Telegraf, Context } from 'telegraf';
import { Deal, TelegramResult } from './types';

// Inicializar bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Canal o grupo destino
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

// Configuración
const CONFIG = {
  parseMode: 'HTML' as const,
  disableWebPagePreview: false, // Mostrar preview de links
  delayBetweenMessages: 2000, // 2 segundos entre mensajes
  maxRetries: 3,
  retryDelay: 5000,
};

/**
 * Envía una oferta al canal de Telegram
 */
export async function sendToTelegram(deal: Deal): Promise<TelegramResult> {
  const message = deal.telegramMessage || formatDealMessage(deal);
  
  try {
    // Intentar enviar con imagen si está disponible
    if (deal.imageUrl && isValidImageUrl(deal.imageUrl)) {
      try {
        await bot.telegram.sendPhoto(CHANNEL_ID, deal.imageUrl, {
          caption: message,
          parse_mode: CONFIG.parseMode,
        });
        
        return { 
          success: true, 
          dealId: deal.id,
          messageType: 'photo'
        };
      } catch (photoError) {
        // Si falla la foto, enviar solo texto
        console.warn(`    ⚠️ No se pudo enviar imagen, enviando texto`);
      }
    }
    
    // Enviar solo texto
    await bot.telegram.sendMessage(CHANNEL_ID, message, {
      parse_mode: CONFIG.parseMode,
      disable_web_page_preview: CONFIG.disableWebPagePreview,
    });
    
    return { 
      success: true, 
      dealId: deal.id,
      messageType: 'text'
    };
    
  } catch (error: any) {
    console.error(`    ✗ Error enviando a Telegram:`, error.message);
    
    return { 
      success: false, 
      dealId: deal.id,
      error: error.message
    };
  }
}

/**
 * Envía múltiples ofertas con delay entre mensajes
 */
export async function sendBatchToTelegram(deals: Deal[]): Promise<TelegramResult[]> {
  const results: TelegramResult[] = [];
  
  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i];
    
    // Reintentos con backoff exponencial
    let result: TelegramResult = { success: false, dealId: deal.id, error: 'No intentado' };
    
    for (let retry = 0; retry < CONFIG.maxRetries; retry++) {
      result = await sendToTelegram(deal);
      
      if (result.success) {
        console.log(`    ✓ Enviado: ${deal.title.substring(0, 40)}...`);
        break;
      }
      
      // Esperar antes de reintentar
      if (retry < CONFIG.maxRetries - 1) {
        const delay = CONFIG.retryDelay * Math.pow(2, retry);
        console.log(`    ⏳ Reintentando en ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    results.push(result);
    
    // Delay entre mensajes para evitar flood
    if (i < deals.length - 1) {
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenMessages));
    }
  }
  
  return results;
}

/**
 * Formatea mensaje de oferta (backup si no hay mensaje IA)
 */
function formatDealMessage(deal: Deal): string {
  const saving = (deal.originalPrice - deal.currentPrice).toFixed(2);
  const urgencyEmoji = deal.discount >= 50 ? '🔥🔥🔥' : deal.discount >= 30 ? '🔥🔥' : '🔥';
  
  let message = `${urgencyEmoji} <b>¡OFERTA FLASH!</b>\n\n`;
  message += `📦 <b>${escapeHtml(deal.title)}</b>\n\n`;
  message += `💰 <s>${deal.originalPrice}€</s> → <b>${deal.currentPrice}€</b>\n`;
  message += `📉 <b>-${deal.discount}%</b> (Ahorras ${saving}€)\n`;
  
  if (deal.timeLeft) {
    message += `⏰ ${deal.timeLeft}\n`;
  }
  
  message += `\n🏪 ${deal.providerName}\n`;
  message += `\n👉 <a href="${deal.affiliateLink}">¡COMPRAR AHORA!</a>`;
  
  // Hashtags
  const hashtags = [`#${deal.category}`, '#Oferta', '#Chollo'].join(' ');
  message += `\n\n${hashtags}`;
  
  return message;
}

/**
 * Escapa caracteres especiales para HTML de Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Valida que una URL de imagen sea válida
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) &&
           /\.(jpg|jpeg|png|gif|webp)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Envía mensaje de texto simple al canal
 */
export async function sendTextMessage(text: string): Promise<boolean> {
  try {
    await bot.telegram.sendMessage(CHANNEL_ID, text, {
      parse_mode: CONFIG.parseMode,
    });
    return true;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return false;
  }
}

/**
 * Envía resumen diario de ofertas
 */
export async function sendDailySummary(stats: {
  totalDeals: number;
  avgDiscount: number;
  topCategories: string[];
  bestDeal?: Deal;
}): Promise<boolean> {
  let message = `📊 <b>RESUMEN DEL DÍA</b>\n\n`;
  message += `📦 Ofertas publicadas: <b>${stats.totalDeals}</b>\n`;
  message += `📉 Descuento medio: <b>${stats.avgDiscount}%</b>\n`;
  message += `🏷️ Categorías top: ${stats.topCategories.join(', ')}\n`;
  
  if (stats.bestDeal) {
    message += `\n🏆 <b>Mejor oferta del día:</b>\n`;
    message += `${stats.bestDeal.title} (-${stats.bestDeal.discount}%)\n`;
    message += `👉 ${stats.bestDeal.affiliateLink}`;
  }
  
  message += `\n\n🔔 ¡Activa notificaciones para no perderte nada!`;
  
  return sendTextMessage(message);
}

/**
 * Obtiene información del bot
 */
export async function getBotInfo(): Promise<{username: string; id: number}> {
  const me = await bot.telegram.getMe();
  return { username: me.username || '', id: me.id };
}

/**
 * Verifica que el bot puede enviar al canal
 */
export async function verifyChannelAccess(): Promise<boolean> {
  try {
    const chat = await bot.telegram.getChat(CHANNEL_ID);
    console.log(`✓ Acceso verificado al canal: ${chat.title || CHANNEL_ID}`);
    return true;
  } catch (error: any) {
    console.error(`✗ No se puede acceder al canal: ${error.message}`);
    return false;
  }
}

export { bot };
