// Mensajes por defecto

import { Deal } from '../types.js';

/**
 * Genera mensaje por defecto si falla la IA
 */
export function generateDefaultMessage(deal: Deal): string {
  const emoji = deal.discount >= 50 ? '🔥🔥' : deal.discount >= 30 ? '🔥' : '💰';
  const ahorro = (deal.originalPrice - deal.currentPrice).toFixed(2);
  
  return `${emoji} ¡OFERTA FLASH!

${deal.title.substring(0, 100)}${deal.title.length > 100 ? '...' : ''}

💰 Antes: ${deal.originalPrice.toFixed(2)}€
✨ Ahora: ${deal.currentPrice.toFixed(2)}€
📉 Descuento: -${deal.discount}%
💎 Ahorras: ${ahorro}€
${deal.timeLeft ? `⏰ ${deal.timeLeft}` : '⚡ Tiempo limitado'}

🏪 ${deal.providerName}

👉 ${deal.affiliateLink}

#Oferta #Chollo #${capitalize(deal.category)}`;
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
