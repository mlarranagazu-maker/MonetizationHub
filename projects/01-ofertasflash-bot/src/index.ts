// OfertasFlash Bot - Entry Point
// Proyecto 1 de MonetizationHub

import { config } from 'dotenv';
import { scrapeMultiProvider } from './scraper.js';
import { generateCopywriting } from './ai.js';
import { sendBatchToTelegram, initBot } from './telegram.js';
import { Deal, BotConfig, RunStats } from './types.js';
import { logger } from './utils/logger.js';
import { generateDefaultMessage } from './utils/messages.js';

// Cargar variables de entorno
config();

// Validar configuración requerida
function validateConfig(): void {
  const required = [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHANNEL_ID',
    'ANTHROPIC_API_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`❌ Variables de entorno requeridas: ${missing.join(', ')}\nCopia .env.example a .env y configúralas.`);
  }
}

// Configuración del bot desde env
const botConfig: BotConfig = {
  maxDeals: parseInt(process.env.MAX_DEALS || '5'),
  minDiscount: parseInt(process.env.MIN_DISCOUNT || '30'),
  categories: (process.env.CATEGORIES || 'electronics,home').split(','),
  providers: (process.env.PROVIDERS || 'amazon_es').split(','),
  languages: (process.env.LANGUAGES || 'es').split(','),
};

async function main(): Promise<RunStats> {
  const stats: RunStats = {
    startTime: new Date(),
    dealsScraped: 0,
    dealsSent: 0,
    errors: [],
    providers: {},
    aiTokensUsed: { input: 0, output: 0 },
    estimatedCost: 0,
  };

  logger.info('🚀 Iniciando OfertasFlash Bot...');
  logger.info(`📅 ${new Date().toISOString()}`);
  logger.info(`⚙️ Config: ${JSON.stringify(botConfig, null, 2)}`);

  try {
    validateConfig();
    initBot();

    // 1. SCRAPING
    logger.info('\n📡 Fase 1: Scraping de ofertas...');
    const deals: Deal[] = await scrapeMultiProvider(botConfig);
    stats.dealsScraped = deals.length;
    
    if (deals.length === 0) {
      logger.warn('⚠️ No se encontraron ofertas que cumplan los criterios');
      stats.endTime = new Date();
      return stats;
    }
    
    logger.success(`✅ Encontradas ${deals.length} ofertas`);
    
    // Contar por proveedor
    deals.forEach(d => {
      stats.providers[d.provider] = (stats.providers[d.provider] || 0) + 1;
    });

    // 2. COPYWRITING CON IA
    logger.info('\n✍️ Fase 2: Generando copywriting con Claude Haiku...');
    const enhancedDeals: Deal[] = [];
    
    for (const deal of deals.slice(0, botConfig.maxDeals)) {
      try {
        const { message, tokens } = await generateCopywriting(deal);
        stats.aiTokensUsed.input += tokens.input;
        stats.aiTokensUsed.output += tokens.output;
        
        enhancedDeals.push({
          ...deal,
          telegramMessage: message,
        });
        logger.info(`  ✓ Copy generado: ${deal.title.substring(0, 40)}...`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        logger.error(`  ✗ Error copywriting: ${errorMsg}`);
        stats.errors.push(`AI Error: ${errorMsg}`);
        
        // Usar mensaje por defecto si falla IA
        enhancedDeals.push({
          ...deal,
          telegramMessage: generateDefaultMessage(deal),
        });
      }
    }

    // Calcular coste estimado
    // Haiku: $0.25/1M input, $1.25/1M output
    stats.estimatedCost = 
      (stats.aiTokensUsed.input * 0.00000025) + 
      (stats.aiTokensUsed.output * 0.00000125);

    // 3. ENVIAR A TELEGRAM
    logger.info('\n📤 Fase 3: Enviando a Telegram...');
    
    if (process.env.DRY_RUN === 'true') {
      logger.warn('🔸 DRY_RUN activo - No se envían mensajes reales');
      enhancedDeals.forEach(d => {
        logger.info(`  [DRY] ${d.title.substring(0, 50)}`);
        logger.debug(d.telegramMessage || '');
      });
      stats.dealsSent = enhancedDeals.length;
    } else {
      const results = await sendBatchToTelegram(enhancedDeals);
      stats.dealsSent = results.filter(r => r.success).length;
      
      results.filter(r => !r.success).forEach(r => {
        stats.errors.push(`Telegram Error: ${r.error}`);
      });
    }

    // 4. RESUMEN
    stats.endTime = new Date();
    const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;
    
    logger.info('\n' + '='.repeat(50));
    logger.info('📊 RESUMEN DE EJECUCIÓN');
    logger.info('='.repeat(50));
    logger.info(`⏱️  Duración: ${duration.toFixed(1)}s`);
    logger.info(`📡 Ofertas scrapeadas: ${stats.dealsScraped}`);
    logger.info(`✍️  Ofertas procesadas: ${enhancedDeals.length}`);
    logger.info(`📤 Mensajes enviados: ${stats.dealsSent}`);
    logger.info(`🏪 Proveedores: ${Object.entries(stats.providers).map(([k,v]) => `${k}(${v})`).join(', ')}`);
    logger.info(`🤖 Tokens IA: ${stats.aiTokensUsed.input} in / ${stats.aiTokensUsed.output} out`);
    logger.info(`💰 Coste estimado: $${stats.estimatedCost.toFixed(4)}`);
    
    if (stats.errors.length > 0) {
      logger.warn(`⚠️  Errores: ${stats.errors.length}`);
      stats.errors.forEach(e => logger.error(`   - ${e}`));
    }
    
    logger.info('='.repeat(50));

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`❌ Error fatal: ${errorMsg}`);
    stats.errors.push(`Fatal: ${errorMsg}`);
    stats.endTime = new Date();
  }

  logger.success('\n🎉 Bot finalizado');
  return stats;
}

// Ejecutar
main().catch(console.error);
