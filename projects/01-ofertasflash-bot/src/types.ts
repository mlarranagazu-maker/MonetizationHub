// Tipos TypeScript para OfertasFlash Bot

/**
 * Representa una oferta/deal scrapeada
 */
export interface Deal {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  imageUrl: string;
  productLink: string;
  affiliateLink: string;
  provider: string;
  providerName: string;
  category: string;
  timeLeft?: string;
  scrapedAt: string;
  telegramMessage?: string;
}

/**
 * Configuración del bot
 */
export interface BotConfig {
  maxDeals: number;
  minDiscount: number;
  categories: string[];
  providers: string[];
  languages: string[];
}

/**
 * Configuración de un proveedor de ofertas
 */
export interface Provider {
  name: string;
  baseUrl: string;
  dealsUrl: string;
  affiliateTag?: string;
  affiliateNetwork?: 'awin' | 'tradedoubler' | 'direct';
  awinId?: string;
  selectors: ProviderSelectors;
}

/**
 * Selectores CSS para scraping
 */
export interface ProviderSelectors {
  dealContainer: string;
  title: string;
  currentPrice: string;
  originalPrice: string;
  discount: string;
  image?: string;
  link?: string;
  timeLeft?: string;
}

/**
 * Resultado de envío a Telegram
 */
export interface TelegramResult {
  success: boolean;
  dealId: string;
  messageType?: 'photo' | 'text';
  error?: string;
}

/**
 * Configuración de copywriting IA
 */
export interface CopywritingConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  language: 'es' | 'de' | 'fr' | 'it' | 'en';
  tone: 'urgente' | 'casual' | 'profesional';
  includeEmojis: boolean;
  includeHashtags: boolean;
  maxLength: number;
}

/**
 * Estadísticas de ejecución
 */
export interface RunStats {
  startTime: Date;
  endTime?: Date;
  dealsScraped: number;
  dealsSent: number;
  errors: string[];
  providers: Record<string, number>;
  aiTokensUsed: {
    input: number;
    output: number;
  };
  estimatedCost: number;
}

/**
 * Token usage from AI
 */
export interface TokenUsage {
  input: number;
  output: number;
}

/**
 * Resultado de generación de copy
 */
export interface CopyResult {
  message: string;
  tokens: TokenUsage;
}
