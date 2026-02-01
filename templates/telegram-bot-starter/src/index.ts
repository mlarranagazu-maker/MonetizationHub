// Bot de Ofertas Flash - Entry Point
// Ejecuta scraping + IA + envío a Telegram

import { config } from 'dotenv';
import { scrapeAmazonDeals, scrapeMultiProvider } from './scraper';
import { generateCopywriting } from './ai';
import { sendToTelegram, sendBatchToTelegram } from './telegram';
import { Deal, BotConfig } from './types';

config();

const botConfig: BotConfig = {
  maxDeals: parseInt(process.env.MAX_DEALS || '5'),
  minDiscount: parseInt(process.env.MIN_DISCOUNT || '30'),
  categories: (process.env.CATEGORIES || 'electronics,home').split(','),
  providers: (process.env.PROVIDERS || 'amazon_es').split(','),
  languages: (process.env.LANGUAGES || 'es').split(','),
};

async function main(): Promise<void> {
  console.log('🚀 Iniciando Bot de Ofertas Flash...');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`⚙️ Config: ${JSON.stringify(botConfig)}`);

  try {
    // 1. Scraping de ofertas de múltiples proveedores
    console.log('\n📡 Fase 1: Scraping de ofertas...');
    const deals: Deal[] = await scrapeMultiProvider(botConfig);
    
    if (deals.length === 0) {
      console.log('⚠️ No se encontraron ofertas que cumplan los criterios');
      return;
    }
    
    console.log(`✅ Encontradas ${deals.length} ofertas`);

    // 2. Generar copywriting con IA para cada oferta
    console.log('\n✍️ Fase 2: Generando copywriting con Claude Haiku...');
    const enhancedDeals: Deal[] = [];
    
    for (const deal of deals.slice(0, botConfig.maxDeals)) {
      try {
        const copy = await generateCopywriting(deal);
        enhancedDeals.push({
          ...deal,
          telegramMessage: copy,
        });
        console.log(`  ✓ Copy generado para: ${deal.title.substring(0, 40)}...`);
      } catch (error) {
        console.error(`  ✗ Error generando copy: ${error}`);
        // Usar mensaje por defecto
        enhancedDeals.push({
          ...deal,
          telegramMessage: generateDefaultMessage(deal),
        });
      }
    }

    // 3. Enviar a Telegram
    console.log('\n📤 Fase 3: Enviando a Telegram...');
    const results = await sendBatchToTelegram(enhancedDeals);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Enviadas ${successCount}/${enhancedDeals.length} ofertas`);

    // 4. Resumen
    console.log('\n📊 Resumen:');
    console.log(`   - Ofertas scrapeadas: ${deals.length}`);
    console.log(`   - Ofertas procesadas: ${enhancedDeals.length}`);
    console.log(`   - Mensajes enviados: ${successCount}`);
    console.log(`   - Proveedores: ${[...new Set(deals.map(d => d.provider))].join(', ')}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }

  console.log('\n🎉 Bot finalizado correctamente');
}

function generateDefaultMessage(deal: Deal): string {
  const emoji = deal.discount >= 50 ? '🔥🔥' : '🔥';
  return `${emoji} ¡OFERTA! ${deal.title}

💰 Antes: ${deal.originalPrice}€ → Ahora: ${deal.currentPrice}€
📉 Descuento: -${deal.discount}%
${deal.timeLeft ? `⏰ Tiempo: ${deal.timeLeft}` : ''}

👉 ${deal.affiliateLink}

#Oferta #${deal.category} #Ahorro`;
}

// Ejecutar
main();
