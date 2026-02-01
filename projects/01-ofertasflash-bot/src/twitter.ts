// 🐦 Cliente Twitter/X para Cross-Posting
// Publica ofertas automáticamente en Twitter/X

import { logger } from './utils/logger.js';
import { Deal } from './types.js';
import crypto from 'crypto';

// Configuración
const TWITTER_API_URL = 'https://api.twitter.com/2/tweets';

interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

interface TwitterResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

/**
 * Obtiene las credenciales de Twitter desde variables de entorno
 */
function getCredentials(): TwitterCredentials {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('Faltan credenciales de Twitter. Configura TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET');
  }

  return { apiKey, apiSecret, accessToken, accessTokenSecret };
}

/**
 * Genera firma OAuth 1.0a para Twitter API
 */
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  credentials: TwitterCredentials
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.keys(params)
      .sort()
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
  )}`;

  const signingKey = `${encodeURIComponent(credentials.apiSecret)}&${encodeURIComponent(credentials.accessTokenSecret)}`;
  
  return crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');
}

/**
 * Genera header OAuth para Twitter API
 */
function generateOAuthHeader(credentials: TwitterCredentials): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };

  const signature = generateOAuthSignature(
    'POST',
    TWITTER_API_URL,
    oauthParams,
    credentials
  );

  oauthParams.oauth_signature = signature;

  const headerString = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${headerString}`;
}

/**
 * Formatea un tweet para una oferta (máx 280 caracteres)
 */
export function formatTweet(deal: Deal): string {
  const emoji = deal.discount >= 50 ? '🔥🔥' : deal.discount >= 30 ? '🔥' : '💰';
  const ahorro = (deal.originalPrice - deal.currentPrice).toFixed(0);
  
  // Título corto (máx 60 chars)
  const shortTitle = deal.title.length > 60 
    ? deal.title.substring(0, 57) + '...' 
    : deal.title;

  // Tweet base
  let tweet = `${emoji} -${deal.discount}% ${shortTitle}

💰 ${deal.originalPrice.toFixed(0)}€ → ${deal.currentPrice.toFixed(0)}€
💎 Ahorras ${ahorro}€

🛒 ${deal.affiliateLink}

#Chollo #Oferta #${capitalize(deal.category)}`;

  // Si es muy largo, acortar
  if (tweet.length > 280) {
    tweet = `${emoji} -${deal.discount}% OFERTA

${shortTitle}

${deal.originalPrice.toFixed(0)}€ → ${deal.currentPrice.toFixed(0)}€

${deal.affiliateLink}

#Chollo #Oferta`;
  }

  return tweet.substring(0, 280);
}

/**
 * Formatea tweet para campaña temática (versión corta)
 */
export function formatCampaignTweet(
  theme: { emoji: string; title: string },
  productCount: number,
  maxDiscount: number,
  telegramChannel: string
): string {
  return `${theme.emoji} ESPECIAL: ${theme.title.toUpperCase()}

📦 ${productCount} productos seleccionados
🔥 Descuentos hasta -${maxDiscount}%

👇 Ver todos en Telegram:
https://t.me/${telegramChannel.replace('@', '')}

#Chollos #Ofertas #Descuentos`.substring(0, 280);
}

/**
 * Publica un tweet
 */
export async function postTweet(text: string): Promise<TwitterResult> {
  try {
    const credentials = getCredentials();
    const authHeader = generateOAuthHeader(credentials);

    const response = await fetch(TWITTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`❌ Error Twitter: ${error}`);
      return { success: false, error };
    }

    const data = await response.json() as { data: { id: string } };
    logger.success(`✅ Tweet publicado: ${data.data.id}`);
    
    return { success: true, tweetId: data.data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`❌ Error publicando tweet: ${message}`);
    return { success: false, error: message };
  }
}

/**
 * Publica una oferta en Twitter
 */
export async function postDealToTwitter(deal: Deal): Promise<TwitterResult> {
  const tweet = formatTweet(deal);
  logger.info(`🐦 Publicando en Twitter: ${deal.title.substring(0, 50)}...`);
  return postTweet(tweet);
}

/**
 * Publica anuncio de campaña en Twitter
 */
export async function postCampaignToTwitter(
  theme: { emoji: string; title: string },
  productCount: number,
  maxDiscount: number,
  telegramChannel: string = 'OfertasFlashES'
): Promise<TwitterResult> {
  const tweet = formatCampaignTweet(theme, productCount, maxDiscount, telegramChannel);
  logger.info(`🐦 Publicando campaña en Twitter: ${theme.title}`);
  return postTweet(tweet);
}

/**
 * Verifica si Twitter está configurado
 */
export function isTwitterConfigured(): boolean {
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
