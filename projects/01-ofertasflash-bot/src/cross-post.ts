// 🔄 Cross-Posting: Telegram + Twitter/X
// Script independiente para publicar ofertas en ambas plataformas

import { config } from 'dotenv';
import { logger } from './utils/logger.js';
import { isTwitterConfigured, postTweet, formatCampaignTweet } from './twitter.js';

config();

interface CrossPostOptions {
  telegram: boolean;
  twitter: boolean;
}

interface CrossPostResult {
  telegram: { success: boolean; error?: string };
  twitter: { success: boolean; error?: string; tweetId?: string };
}

/**
 * Publica en Telegram
 */
async function postToTelegram(message: string): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !chatId) {
    return { success: false, error: 'Faltan credenciales Telegram' };
  }

  try {
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
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

/**
 * Cross-post a ambas plataformas
 */
export async function crossPost(
  telegramMessage: string,
  twitterMessage: string,
  options: CrossPostOptions = { telegram: true, twitter: true }
): Promise<CrossPostResult> {
  const result: CrossPostResult = {
    telegram: { success: false },
    twitter: { success: false },
  };

  // Telegram
  if (options.telegram) {
    logger.info('📤 Publicando en Telegram...');
    result.telegram = await postToTelegram(telegramMessage);
    if (result.telegram.success) {
      logger.success('✅ Telegram: OK');
    } else {
      logger.error(`❌ Telegram: ${result.telegram.error}`);
    }
  }

  // Twitter
  if (options.twitter && isTwitterConfigured()) {
    logger.info('🐦 Publicando en Twitter...');
    const twitterResult = await postTweet(twitterMessage);
    result.twitter = twitterResult;
    if (result.twitter.success) {
      logger.success(`✅ Twitter: OK (${result.twitter.tweetId})`);
    } else {
      logger.error(`❌ Twitter: ${result.twitter.error}`);
    }
  } else if (options.twitter) {
    logger.warn('⚠️ Twitter no configurado, saltando...');
  }

  return result;
}

/**
 * Genera versión corta para Twitter desde mensaje largo de Telegram
 */
export function telegramToTwitter(
  telegramMessage: string,
  link: string
): string {
  // Extraer info clave del mensaje de Telegram
  const discountMatch = telegramMessage.match(/-(\d+)%/);
  const discount = discountMatch ? discountMatch[1] : '';
  
  // Buscar el título (primera línea significativa)
  const lines = telegramMessage.split('\n').filter(l => l.trim());
  let title = '';
  for (const line of lines) {
    if (line.length > 20 && !line.includes('━') && !line.includes('┌') && !line.includes('│')) {
      title = line.replace(/[*_~`#]/g, '').trim();
      break;
    }
  }
  
  const shortTitle = title.substring(0, 80);
  
  return `🔥 ${discount ? `-${discount}% ` : ''}${shortTitle}

🛒 ${link}

#Chollo #Oferta #Descuento`.substring(0, 280);
}

// Ejemplo de uso directo
async function main() {
  logger.info('🔄 Cross-Post Test\n');

  const telegramMsg = `🔥🔥 **¡CHOLLAZO!** 🔥🔥

📦 Auriculares Sony WH-1000XM5

┌─────────────────────────
│ ❌ Antes: 399€
│ ✅ AHORA: 279€
│ 💰 Ahorras: 120€
└─────────────────────────

🛒 https://amzn.to/example

#Chollo #Auriculares`;

  const twitterMsg = `🔥 -30% Auriculares Sony WH-1000XM5

399€ → 279€ (Ahorras 120€)

🛒 https://amzn.to/example

#Chollo #Sony #Auriculares`;

  const result = await crossPost(telegramMsg, twitterMsg, {
    telegram: true,
    twitter: isTwitterConfigured(),
  });

  console.log('\n📊 Resultados:', result);
}

// Solo ejecutar si es el archivo principal
if (process.argv[1]?.includes('cross-post')) {
  main();
}
