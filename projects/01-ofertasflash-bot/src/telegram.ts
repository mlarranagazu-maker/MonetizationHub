// Cliente Telegram Bot con Telegraf
// Envío de ofertas a canal/grupo

import { Telegraf } from 'telegraf';
import { Deal, TelegramResult } from './types.js';
import { logger } from './utils/logger.js';

// Bot instance (lazy init)
let bot: Telegraf | null = null;

// Configuración
const CONFIG = {
  parseMode: 'HTML' as const,
  disableWebPagePreview: false,
  delayBetweenMessages: 3000, // 3 segundos entre mensajes
  maxRetries: 3,
  retryDelay: 5000,
};

/**
 * Inicializa el bot de Telegram
 */
export function initBot(): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN no configurado');
  }
  bot = new Telegraf(token);
  logger.info('🤖 Bot de Telegram inicializado');
}

/**
 * Obtiene el ID del canal destino
 */
function getChannelId(): string {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!channelId) {
    throw new Error('TELEGRAM_CHANNEL_ID no configurado');
  }
  return channelId;
}

/**
 * Verifica si una URL de imagen es válida
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Formatea un mensaje por defecto para una oferta
 */
function formatDealMessage(deal: Deal): string {
  const emoji = deal.discount >= 50 ? '🔥🔥' : deal.discount >= 30 ? '🔥' : '💰';
  const ahorro = (deal.originalPrice - deal.currentPrice).toFixed(2);
  
  return `${emoji} <b>¡OFERTA!</b> ${escapeHtml(deal.title.substring(0, 100))}

💰 <s>${deal.originalPrice.toFixed(2)}€</s> → <b>${deal.currentPrice.toFixed(2)}€</b>
📉 <b>-${deal.discount}%</b> = Ahorras ${ahorro}€
🏪 ${deal.providerName}
${deal.timeLeft ? `⏰ ${deal.timeLeft}` : ''}

👉 ${deal.affiliateLink}

#Oferta #${deal.category.charAt(0).toUpperCase() + deal.category.slice(1)} #Ahorro`;
}

/**
 * Escapa caracteres HTML
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Envía una oferta al canal de Telegram
 */
export async function sendToTelegram(deal: Deal): Promise<TelegramResult> {
  if (!bot) {
    return { success: false, dealId: deal.id, error: 'Bot no inicializado' };
  }

  const channelId = getChannelId();
  const message = deal.telegramMessage || formatDealMessage(deal);
  
  try {
    // Intentar enviar con imagen si está disponible
    if (deal.imageUrl && isValidImageUrl(deal.imageUrl)) {
      try {
        await bot.telegram.sendPhoto(channelId, deal.imageUrl, {
          caption: message,
          parse_mode: CONFIG.parseMode,
        });
        
        return { 
          success: true, 
          dealId: deal.id,
          messageType: 'photo'
        };
      } catch (photoError) {
        // Si falla la foto, intentar con texto
        logger.debug(`    ⚠️ Imagen falló, enviando texto`);
      }
    }
    
    // Enviar solo texto
    await bot.telegram.sendMessage(channelId, message, {
      parse_mode: CONFIG.parseMode,
      link_preview_options: {
        is_disabled: CONFIG.disableWebPagePreview,
      }
    });
    
    return { 
      success: true, 
      dealId: deal.id,
      messageType: 'text'
    };
    
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`    ✗ Error Telegram: ${errorMsg}`);
    
    return { 
      success: false, 
      dealId: deal.id,
      error: errorMsg
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
        logger.info(`    ✓ Enviado: ${deal.title.substring(0, 40)}...`);
        break;
      }
      
      // Esperar antes de reintentar
      if (retry < CONFIG.maxRetries - 1) {
        const delay = CONFIG.retryDelay * Math.pow(2, retry);
        logger.debug(`    ⏳ Reintentando en ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    results.push(result);
    
    // Delay entre mensajes para evitar rate limiting
    if (i < deals.length - 1) {
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenMessages));
    }
  }
  
  return results;
}

/**
 * Envía mensaje de test para verificar configuración
 */
export async function sendTestMessage(): Promise<boolean> {
  if (!bot) {
    initBot();
  }
  
  try {
    const channelId = getChannelId();
    await bot!.telegram.sendMessage(
      channelId,
      '🧪 <b>Test OfertasFlash Bot</b>\n\n✅ Conexión exitosa\n📅 ' + new Date().toLocaleString('es-ES'),
      { parse_mode: 'HTML' }
    );
    return true;
  } catch (error) {
    logger.error('Error en test:', error);
    return false;
  }
}
