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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMoneyEur(value: number): string {
  if (!Number.isFinite(value)) return '-';
  return `${value.toFixed(2)}€`;
}

export function buildDailyDigestMessage(deals: Deal[]): string {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit' });

  const header = `🗞️ <b>Top chollos del día</b> · ${escapeHtml(dateLabel)} · <b>08:45</b>`;
  const intro = 'Selección curada: sin repetidos, con ahorro real.';

  const lines: string[] = [header, intro, ''];

  deals.forEach((deal, idx) => {
    const savings = Math.max(0, deal.originalPrice - deal.currentPrice);
    const title = escapeHtml(deal.title.substring(0, 90));

    lines.push(
      `<b>${idx + 1})</b> ${title}`,
      `💰 <b>${formatMoneyEur(deal.currentPrice)}</b> (antes <s>${formatMoneyEur(deal.originalPrice)}</s>) · 📉 <b>-${deal.discount}%</b> · Ahorras <b>${formatMoneyEur(savings)}</b>`,
      `🛒 ${escapeHtml(deal.providerName)} · 🔗 ${deal.affiliateLink}`,
      ''
    );
  });

  lines.push('📌 <b>Síguenos</b> y reenvía este digest para apoyar el canal.');

  return lines.join('\n');
}

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
 * Formatea un mensaje viral para una oferta
 */
function formatDealMessage(deal: Deal): string {
  const ahorro = (deal.originalPrice - deal.currentPrice).toFixed(2);
  
  // Header impactante según descuento
  let header: string;
  let urgency: string;
  
  if (deal.discount >= 70) {
    header = `🚨🚨🚨 <b>¡¡PRECIO MÍNIMO HISTÓRICO!!</b> 🚨🚨🚨
⚡ <b>-${deal.discount}%</b> ⚡ CORRED QUE VUELA`;
    urgency = `⚡ <b>ÚLTIMAS UNIDADES</b> - Puede agotarse YA`;
  } else if (deal.discount >= 50) {
    header = `🔥🔥 <b>¡¡CHOLLAZO BRUTAL!!</b> 🔥🔥
💥 <b>-${deal.discount}%</b> 💥 ¡A MITAD DE PRECIO!`;
    urgency = `⏰ Unidades MUY limitadas`;
  } else if (deal.discount >= 40) {
    header = `🔥 <b>¡OFERTÓN!</b> 🔥 <b>-${deal.discount}%</b>`;
    urgency = `⏰ Oferta temporal`;
  } else if (deal.discount >= 30) {
    header = `💰 <b>¡BUEN CHOLLO!</b> 💰 <b>-${deal.discount}%</b>`;
    urgency = `⏰ Disponible por tiempo limitado`;
  } else {
    header = `✨ <b>OFERTA</b> ✨ <b>-${deal.discount}%</b>`;
    urgency = deal.timeLeft ? `⏰ ${deal.timeLeft}` : '';
  }
  
  return `${header}

📦 ${escapeHtml(deal.title.substring(0, 80))}

┌─────────────────────────
│ ❌ Antes: <s>${deal.originalPrice.toFixed(2)}€</s>
│ ✅ <b>AHORA: ${deal.currentPrice.toFixed(2)}€</b>
│ 💰 Ahorras: <b>${ahorro}€</b>
└─────────────────────────

${urgency}

🛒 ${deal.providerName}
🔗 <b>COMPRAR:</b> ${deal.affiliateLink}

${deal.discount >= 50 ? '👆 CORRE antes de que vuele' : '👆 Click para ver'}
${deal.discount >= 40 ? '🔔 Activa notificaciones = Más chollos' : '📢 Comparte si te mola'}

━━━━━━━━━━━━━━━━━━━
📲 <b>@OfertasFlashES</b>
#Chollo #${deal.category.charAt(0).toUpperCase() + deal.category.slice(1)} #Ahorro${deal.discount}`;
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

export async function sendDigestToTelegram(deals: Deal[]): Promise<TelegramResult> {
  if (!bot) {
    return { success: false, dealId: 'digest', error: 'Bot no inicializado' };
  }

  if (deals.length === 0) {
    return { success: false, dealId: 'digest', error: 'Sin ofertas para digest' };
  }

  const channelId = getChannelId();
  const message = buildDailyDigestMessage(deals);

  try {
    await bot.telegram.sendMessage(channelId, message, {
      parse_mode: CONFIG.parseMode,
      link_preview_options: {
        is_disabled: true,
      }
    });

    return { success: true, dealId: 'digest', messageType: 'text' };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`    ✗ Error Telegram digest: ${errorMsg}`);
    return { success: false, dealId: 'digest', error: errorMsg };
  }
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
