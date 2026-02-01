// Integración con Claude Haiku para copywriting persuasivo
// Optimizado para coste mínimo (~$0.001 por oferta)

import Anthropic from '@anthropic-ai/sdk';
import { Deal, CopywritingConfig } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
): Promise<string> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const systemPrompt = `Eres un experto copywriter especializado en ofertas flash y marketing de afiliación.
Tu objetivo es crear mensajes IRRESISTIBLES para Telegram que generen clicks.

REGLAS:
- Máximo ${cfg.maxLength} caracteres
- Usa emojis estratégicamente (🔥💰⚡🎯✨)
- Crea URGENCIA (tiempo limitado, stock bajo)
- Destaca el AHORRO en euros y porcentaje
- Incluye CTA claro al final
- Tono: ${cfg.tone}
- Idioma: ${cfg.language === 'es' ? 'Español de España' : cfg.language}
- NO inventes características del producto
- NO uses lenguaje genérico, sé específico`;

  const userPrompt = `Crea un mensaje de Telegram para esta oferta:

PRODUCTO: ${deal.title}
PRECIO ORIGINAL: ${deal.originalPrice}€
PRECIO ACTUAL: ${deal.currentPrice}€
DESCUENTO: ${deal.discount}%
AHORRO: ${(deal.originalPrice - deal.currentPrice).toFixed(2)}€
CATEGORÍA: ${deal.category}
${deal.timeLeft ? `TIEMPO RESTANTE: ${deal.timeLeft}` : ''}
TIENDA: ${deal.providerName}

El link de afiliado se añadirá automáticamente al final, NO lo incluyas.
${cfg.includeHashtags ? 'Incluye 2-3 hashtags relevantes al final.' : ''}`;

  try {
    const response = await anthropic.messages.create({
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

    // Log de uso para tracking de costes
    console.log(`    💰 Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);
    
    return message;

  } catch (error) {
    console.error('Error generando copywriting:', error);
    throw error;
  }
}

/**
 * Genera múltiples mensajes en batch (más eficiente)
 */
export async function generateBatchCopywriting(
  deals: Deal[],
  config: Partial<CopywritingConfig> = {}
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  // Procesar en paralelo pero con límite de concurrencia
  const CONCURRENCY = 3;
  
  for (let i = 0; i < deals.length; i += CONCURRENCY) {
    const batch = deals.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (deal) => {
      try {
        const copy = await generateCopywriting(deal, config);
        results.set(deal.id, copy);
      } catch (error) {
        console.error(`Error en deal ${deal.id}:`, error);
        results.set(deal.id, generateFallbackMessage(deal));
      }
    });
    
    await Promise.all(promises);
    
    // Delay entre batches para respetar rate limits
    if (i + CONCURRENCY < deals.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  return results;
}

/**
 * Genera mensaje de respaldo si falla la IA
 */
function generateFallbackMessage(deal: Deal): string {
  const saving = (deal.originalPrice - deal.currentPrice).toFixed(2);
  
  const templates = [
    `🔥 ¡OFERTAZA! ${deal.title}\n\n💰 ${deal.originalPrice}€ → ${deal.currentPrice}€\n📉 Te ahorras ${saving}€ (-${deal.discount}%)\n\n👉 ${deal.affiliateLink}`,
    `⚡ ¡CHOLLAZO! -${deal.discount}% en ${deal.title}\n\nAntes: ${deal.originalPrice}€\nAhora: ${deal.currentPrice}€\n\n👉 ${deal.affiliateLink}`,
    `💥 ¡PRECIO MÍNIMO!\n\n${deal.title}\n\n🏷️ Solo ${deal.currentPrice}€ (antes ${deal.originalPrice}€)\n\n👉 ${deal.affiliateLink}`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Estima coste de procesar N ofertas
 */
export function estimateCost(numberOfDeals: number): {
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
} {
  // Estimación basada en uso típico
  const avgInputTokens = 300; // prompt + oferta
  const avgOutputTokens = 100; // mensaje generado
  
  const totalInput = numberOfDeals * avgInputTokens;
  const totalOutput = numberOfDeals * avgOutputTokens;
  
  // Precios Claude Haiku (enero 2026)
  const inputCostPer1M = 0.25;
  const outputCostPer1M = 1.25;
  
  const cost = (totalInput / 1_000_000 * inputCostPer1M) + 
               (totalOutput / 1_000_000 * outputCostPer1M);
  
  return {
    inputTokens: totalInput,
    outputTokens: totalOutput,
    costUSD: Math.round(cost * 10000) / 10000
  };
}

/**
 * Templates multiidioma
 */
export const TEMPLATES = {
  es: {
    flash: '🔥 ¡OFERTA FLASH!',
    saving: 'Te ahorras',
    was: 'Antes',
    now: 'Ahora',
    cta: '¡Lo quiero!',
    hurry: '⏰ ¡Corre que vuela!'
  },
  de: {
    flash: '🔥 BLITZANGEBOT!',
    saving: 'Sie sparen',
    was: 'Vorher',
    now: 'Jetzt',
    cta: 'Jetzt kaufen!',
    hurry: '⏰ Schnell sein!'
  },
  fr: {
    flash: '🔥 OFFRE FLASH!',
    saving: 'Vous économisez',
    was: 'Avant',
    now: 'Maintenant',
    cta: 'J\'en profite!',
    hurry: '⏰ Vite!'
  },
  it: {
    flash: '🔥 OFFERTA LAMPO!',
    saving: 'Risparmi',
    was: 'Prima',
    now: 'Adesso',
    cta: 'Lo voglio!',
    hurry: '⏰ Affrettati!'
  },
  en: {
    flash: '🔥 FLASH DEAL!',
    saving: 'You save',
    was: 'Was',
    now: 'Now',
    cta: 'Get it now!',
    hurry: '⏰ Hurry!'
  }
};
