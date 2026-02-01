// Tipos TypeScript para el Bot de Ofertas Flash

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
 * Configuración de variables de entorno
 */
export interface EnvConfig {
  // Telegram
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHANNEL_ID: string;
  
  // Claude AI
  ANTHROPIC_API_KEY: string;
  
  // Amazon
  AMAZON_ES_TAG: string;
  AMAZON_DE_TAG?: string;
  AMAZON_FR_TAG?: string;
  
  // Awin
  AWIN_PUBLISHER_ID?: string;
  
  // Bot config
  MAX_DEALS: string;
  MIN_DISCOUNT: string;
  CATEGORIES: string;
  PROVIDERS: string;
  LANGUAGES: string;
}

/**
 * Respuesta de la API de Amazon Product Advertising
 */
export interface AmazonPAAPIResponse {
  ItemsResult?: {
    Items: AmazonItem[];
  };
  Errors?: Array<{
    Code: string;
    Message: string;
  }>;
}

export interface AmazonItem {
  ASIN: string;
  DetailPageURL: string;
  ItemInfo?: {
    Title?: {
      DisplayValue: string;
    };
  };
  Offers?: {
    Listings?: Array<{
      Price?: {
        Amount: number;
        Currency: string;
        DisplayAmount: string;
      };
      SavingBasis?: {
        Amount: number;
        DisplayAmount: string;
      };
    }>;
  };
  Images?: {
    Primary?: {
      Large?: {
        URL: string;
      };
    };
  };
}

/**
 * Categorías soportadas
 */
export type Category = 
  | 'electronics'
  | 'gaming'
  | 'home'
  | 'fashion'
  | 'sports'
  | 'beauty'
  | 'toys'
  | 'books'
  | 'general';

/**
 * Idiomas soportados
 */
export type SupportedLanguage = 'es' | 'de' | 'fr' | 'it' | 'en' | 'pt';

/**
 * Proveedores soportados
 */
export type SupportedProvider = 
  | 'amazon_es'
  | 'amazon_de'
  | 'amazon_fr'
  | 'amazon_it'
  | 'amazon_uk'
  | 'elcorteingles'
  | 'decathlon'
  | 'pccomponentes'
  | 'mediamarkt'
  | 'zalando';
