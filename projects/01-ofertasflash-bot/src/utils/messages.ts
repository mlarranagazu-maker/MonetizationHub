// Mensajes por defecto - Optimizados para viralidad

import { Deal } from '../types.js';

/**
 * Genera mensaje viral y compartible
 */
export function generateDefaultMessage(deal: Deal): string {
  const ahorro = (deal.originalPrice - deal.currentPrice).toFixed(2);
  
  // Headers más impactantes según descuento
  const header = getViralHeader(deal.discount);
  
  // Urgencia dinámica
  const urgency = getUrgencyMessage(deal.discount, deal.timeLeft);
  
  // Social proof y CTA
  const cta = getCallToAction(deal.discount);
  
  return `${header}

📦 ${deal.title.substring(0, 80)}${deal.title.length > 80 ? '...' : ''}

┌─────────────────────────
│ ❌ Antes: ${deal.originalPrice.toFixed(2)}€
│ ✅ AHORA: ${deal.currentPrice.toFixed(2)}€
│ 💰 Te ahorras: ${ahorro}€
└─────────────────────────

${urgency}

🛒 ${deal.providerName}
🔗 COMPRAR: ${deal.affiliateLink}

${cta}

━━━━━━━━━━━━━━━━━━━
📲 @OfertasFlashES
#Chollo #Oferta #${capitalize(deal.category)} #Ahorro${deal.discount}`;
}

/**
 * Headers virales según nivel de descuento
 */
function getViralHeader(discount: number): string {
  if (discount >= 70) {
    return `🚨🚨🚨 ¡¡PRECIO MÍNIMO HISTÓRICO!! 🚨🚨🚨
⚡ -${discount}% ⚡ CORRED QUE VUELA`;
  }
  if (discount >= 50) {
    return `🔥🔥 ¡¡CHOLLAZO BRUTAL!! 🔥🔥
💥 -${discount}% 💥 ¡A MITAD DE PRECIO!`;
  }
  if (discount >= 40) {
    return `🔥 ¡OFERTÓN INCREÍBLE! 🔥
📉 -${discount}% de descuento`;
  }
  if (discount >= 30) {
    return `💰 ¡BUEN CHOLLO! 💰
📉 -${discount}% de descuento`;
  }
  return `✨ OFERTA DEL DÍA ✨
📉 -${discount}% de descuento`;
}

/**
 * Mensajes de urgencia
 */
function getUrgencyMessage(discount: number, timeLeft?: string): string {
  if (timeLeft) {
    return `⏰ QUEDA: ${timeLeft}
⚠️ Unidades muy limitadas`;
  }
  if (discount >= 50) {
    return `⚡ ÚLTIMAS UNIDADES
⏰ Puede agotarse en minutos`;
  }
  return `⏰ Oferta por tiempo limitado
💨 ¡No dejes que se agote!`;
}

/**
 * Call to action viral
 */
function getCallToAction(discount: number): string {
  if (discount >= 50) {
    return `👆 CORRE antes de que vuele
💬 ¿Lo pillas? Cuéntanos 👇`;
  }
  if (discount >= 30) {
    return `👆 Click para comprar
🔔 Activa notificaciones = Más chollos`;
  }
  return `👆 Ver oferta completa
📢 Comparte si te mola`;
}

/**
 * Capitaliza primera letra
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Templates por idioma
 */
export const MESSAGE_TEMPLATES = {
  es: {
    flash: '🔥 ¡OFERTA FLASH! {title}\n💰 {oldPrice}€ → {newPrice}€ (-{discount}%)\n👉 {link}',
    regular: '💰 {title}\nPrecio: {newPrice}€ (antes {oldPrice}€)\n👉 {link}',
  },
  de: {
    flash: '🔥 BLITZANGEBOT! {title}\n💰 {oldPrice}€ → {newPrice}€ (-{discount}%)\n👉 {link}',
    regular: '💰 {title}\nPreis: {newPrice}€ (vorher {oldPrice}€)\n👉 {link}',
  },
  fr: {
    flash: '🔥 OFFRE FLASH! {title}\n💰 {oldPrice}€ → {newPrice}€ (-{discount}%)\n👉 {link}',
    regular: '💰 {title}\nPrix: {newPrice}€ (avant {oldPrice}€)\n👉 {link}',
  },
};
