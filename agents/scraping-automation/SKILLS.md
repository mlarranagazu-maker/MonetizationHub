# 🕷️ Scraping & Automation Agent

## Especialización
Extracción de datos de Amazon y automatización de procesos para proyectos de afiliados.

## Stack Principal

### Herramientas de Scraping
| Herramienta | Tipo | Uso Ideal |
|-------------|------|-----------|
| **Puppeteer** | Browser automation | Páginas dinámicas (JS) |
| **Playwright** | Browser automation | Cross-browser testing |
| **Cheerio** | HTML parsing | Páginas estáticas (rápido) |
| **Axios** | HTTP client | API calls, páginas simples |

### Automatización (Free Tier)
| Plataforma | Límite Gratis | Frecuencia |
|------------|---------------|------------|
| **GitHub Actions** | 2000 min/mes | Cada 5-30 min |
| **Cloudflare Workers** | 100K req/día | On-demand |
| **Vercel Cron** | 1 job gratis | Cada hora |

## Patrones de Scraping Amazon

### Estructura de Datos de Producto
```typescript
interface AmazonProduct {
  asin: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  isPrime: boolean;
  imageUrl: string;
  productUrl: string;
  category: string;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock';
  scrapedAt: Date;
}
```

### Selectores CSS Amazon (2024)
```javascript
const selectors = {
  // Página de producto
  title: '#productTitle',
  price: '.a-price .a-offscreen',
  originalPrice: '.a-text-price .a-offscreen',
  rating: '#acrPopover .a-icon-alt',
  reviewCount: '#acrCustomerReviewText',
  
  // Lista de productos
  productCard: '[data-component-type="s-search-result"]',
  productTitle: 'h2 a span',
  productPrice: '.a-price-whole',
  
  // Ofertas
  dealBadge: '.dealBadge',
  dealPrice: '.a-color-price',
  dealDiscount: '.savingsPercentage'
};
```

## GitHub Actions Workflow

### Cron Job Básico (cada 30 min)
```yaml
name: Scrape Amazon Deals
on:
  schedule:
    - cron: '*/30 * * * *'  # Cada 30 minutos
  workflow_dispatch:         # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run scraper
        run: npm run scrape
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
```

## Anti-Detección

### Headers Realistas
```typescript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
};
```

### Rate Limiting
```typescript
// Delay aleatorio entre requests
const delay = (min: number, max: number) => 
  new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

// Entre cada request: 2-5 segundos
await delay(2000, 5000);
```

## Validación de Datos

### Schema Zod
```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  asin: z.string().length(10),
  title: z.string().min(10).max(500),
  currentPrice: z.number().positive(),
  discountPercent: z.number().min(0).max(99),
  rating: z.number().min(1).max(5),
});

// Validar antes de procesar
const validProduct = ProductSchema.safeParse(scrapedData);
```

## Manejo de Errores

```typescript
async function scrapeWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await scrape(url);
    } catch (error) {
      console.log(`Intento ${i + 1} fallido: ${error.message}`);
      await delay(5000 * (i + 1), 10000 * (i + 1)); // Backoff exponencial
    }
  }
  throw new Error(`Scraping fallido después de ${maxRetries} intentos`);
}
```

## Integración con Otros Agentes

| Agente | Flujo de Datos |
|--------|----------------|
| **ai-integration** | Envía productos → Recibe copywriting |
| **telegram-bot** | Envía ofertas formateadas |
| **fullstack-dev** | Proporciona API de productos |
| **devops-deploy** | Configura cron jobs |
