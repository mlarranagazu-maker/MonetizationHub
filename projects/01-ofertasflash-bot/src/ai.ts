// Integración con Claude Haiku para copywriting persuasivo
// Optimizado para coste mínimo (~$0.001 por oferta)

import Anthropic from '@anthropic-ai/sdk';
import { Deal, CopywritingConfig, CopyResult } from './types.js';
import { logger } from './utils/logger.js';

// Cliente Anthropic (inicialización lazy)
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY no configurada');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

// Configuración por defecto
const DEFAULT_CONFIG: CopywritingConfig = {
  model: 'claude-3-haiku-20240307',
  maxTokens: 200,
  temperature: 0.8,
  language: 'es',
  tone: 'urgente',
  includeEmojis: true,
  includeHashtags: true,
  maxLength: 280, // Optimizado para Telegram
};

/**
 * Genera mensaje de copywriting para una oferta
 */
export async function generateCopywriting(
  deal: Deal, 
  config: Partial<CopywritingConfig> = {}
): Promise<CopyResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const systemPrompt = `Eres un experto copywriter especializado en ofertas flash y marketing de afiliación.
Tu objetivo es crear mensajes IRRESISTIBLES para Telegram que generen clicks.

REGLAS ESTRICTAS:
- Máximo ${cfg.maxLength} caracteres
- Usa emojis estratégicamente: 🔥💰⚡🎯✨💎🚀
- Crea URGENCIA (tiempo limitado, stock bajo, "últimas unidades")
- Destaca el AHORRO tanto en euros como en porcentaje
- Incluye CTA claro al final ("Ver oferta", "Cómpralo ya")
- Tono: ${cfg.tone}
- Idioma: ${cfg.language === 'es' ? 'Español de España' : cfg.language}
- NO inventes características del producto
- NO uses lenguaje genérico, sé ESPECÍFICO con el producto
- SIEMPRE incluye el precio actual

ESTRUCTURA IDEAL:
1. Emoji + Hook con urgencia
2. Nombre producto (acortado si es largo)
3. Precio: X€ (antes Y€)
4. Ahorro: -Z% = ahorro €
5. CTA con emoji`;

  const ahorro = deal.originalPrice - deal.currentPrice;
  
  const userPrompt = `Crea un mensaje de Telegram para esta oferta:

PRODUCTO: ${deal.title}
PRECIO ORIGINAL: ${deal.originalPrice.toFixed(2)}€
PRECIO ACTUAL: ${deal.currentPrice.toFixed(2)}€
DESCUENTO: ${deal.discount}%
AHORRO TOTAL: ${ahorro.toFixed(2)}€
CATEGORÍA: ${deal.category}
TIENDA: ${deal.providerName}
${deal.timeLeft ? `TIEMPO RESTANTE: ${deal.timeLeft}` : 'Oferta limitada'}

⚠️ El link de afiliado se añadirá automáticamente al final, NO lo incluyas.
${cfg.includeHashtags ? 'Incluye 2-3 hashtags relevantes al final: #Oferta #Chollo etc.' : ''}`;

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: cfg.model,
      max_tokens: cfg.maxTokens,
      temperature: cfg.temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada de Claude');
    }

    // Añadir link al final
    let message = content.text.trim();
    message += `\n\n👉 ${deal.affiliateLink}`;

    // Log de uso
    logger.debug(`    💰 Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);
    
    return {
      message,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      }
    };

  } catch (error) {
    logger.error('Error generando copywriting:', error);
    throw error;
  }
}

/**
 * Genera múltiples mensajes en batch (más eficiente)
 */
export async function generateBatchCopywriting(
  deals: Deal[],
  config: Partial<CopywritingConfig> = {}
): Promise<Map<string, CopyResult>> {
  const results = new Map<string, CopyResult>();
  
  // Procesar secuencialmente para evitar rate limits
  for (const deal of deals) {
    try {
      const result = await generateCopywriting(deal, config);
      results.set(deal.id, result);
      
      // Pequeño delay para evitar rate limits
      await new Promise(r => setTimeout(r, 200));
    } catch (error) {
      logger.error(`Error generando copy para ${deal.id}:`, error);
    }
  }
  
  return results;
}

/**
 * Traduce un mensaje a otro idioma
 */
export async function translateMessage(
  message: string,
  targetLanguage: 'de' | 'fr' | 'it' | 'en'
): Promise<string> {
  const languageNames: Record<string, string> = {
    de: 'Alemán (Alemania)',
    fr: 'Francés (Francia)',
    it: 'Italiano',
    en: 'Inglés (UK)',
  };

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 250,
      temperature: 0.3, // Más bajo para traducción precisa
      messages: [
        { 
          role: 'user', 
          content: `Traduce este mensaje de oferta de Telegram al ${languageNames[targetLanguage]}. 
Mantén los emojis, el formato y el tono urgente. 
Adapta expresiones culturalmente (no traduzcas literalmente).
NO traduzcas el link ni los hashtags.

Mensaje:
${message}` 
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada');
    }

    return content.text.trim();

  } catch (error) {
    logger.error('Error traduciendo:', error);
    throw error;
  }
}
