# 🤖 AI Integration Agent

## Especialización
Integración de modelos de IA (Claude/OpenAI) para generación de contenido de alta conversión con optimización de costes.

## Modelos y Costes (2024)

### Anthropic Claude
| Modelo | Input | Output | Velocidad | Uso Ideal |
|--------|-------|--------|-----------|-----------|
| **Haiku** | $0.25/1M | $1.25/1M | ⚡⚡⚡ | Copywriting ofertas, alto volumen |
| **Sonnet** | $3/1M | $15/1M | ⚡⚡ | Análisis, comparaciones |
| **Opus** | $15/1M | $75/1M | ⚡ | Tareas complejas (raro uso) |

### OpenAI
| Modelo | Input | Output | Uso Ideal |
|--------|-------|--------|-----------|
| **GPT-4o-mini** | $0.15/1M | $0.60/1M | Alternativa barata a Haiku |
| **GPT-4o** | $5/1M | $15/1M | Cuando Claude no disponible |

## Estimación de Costes

### Bot de Ofertas (100 productos/día)
```
Tokens por oferta: ~300 input + ~150 output = 450 tokens
100 ofertas/día = 45,000 tokens/día

Con Haiku:
- Input: 30,000 × $0.25/1M = $0.0075
- Output: 15,000 × $1.25/1M = $0.019
- Total/día: ~$0.03
- Total/mes: ~$0.90 ✅
```

## Configuración Cliente

### SDK Anthropic (TypeScript)
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateCopy(product: Product): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Genera un mensaje de oferta para Telegram:
        Producto: ${product.title}
        Precio: ${product.currentPrice}€ (antes ${product.originalPrice}€)
        Descuento: ${product.discountPercent}%
        Rating: ${product.rating}/5 (${product.reviewCount} reseñas)
        
        Reglas:
        - Máximo 3 líneas
        - Usa emojis relevantes
        - Incluye urgencia
        - Tono persuasivo pero honesto`
    }]
  });
  
  return response.content[0].text;
}
```

## Prompts Optimizados

### 1. Copywriting Ofertas (Telegram)
```
Sistema: Eres un experto en copywriting de e-commerce. Generas mensajes 
de ofertas cortos, persuasivos y con emojis. Nunca mientes sobre descuentos.

Input: [datos producto]

Output esperado:
🔥 OFERTÓN: AirPods Pro 2 a 199€
Precio normal: 279€ | Ahorro: 80€ (-29%)
⭐ 4.8/5 con +50K reseñas
⚡ Stock limitado - Oferta Prime Day
```

### 2. Resumen de Reseñas
```
Analiza estas reseñas de Amazon y resume en:
- 3 puntos positivos más mencionados
- 2 puntos negativos más comunes
- Veredicto: ¿Vale la pena? (1 línea)

Reseñas: [array de reseñas]
```

### 3. Comparación de Productos
```
Compara estos 3 productos como alternativas:
- Producto A (caro): [datos]
- Producto B: [datos]
- Producto C: [datos]

Genera una tabla comparativa y recomienda cuál comprar según:
1. Mejor calidad-precio
2. Mejor para presupuesto ajustado
3. Mejor si quieres lo mejor
```

## Caching de Respuestas

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 60 * 24, // 24 horas
});

async function generateWithCache(key: string, generator: () => Promise<string>) {
  const cached = cache.get(key);
  if (cached) return cached;
  
  const result = await generator();
  cache.set(key, result);
  return result;
}
```

## Control de Costes

### Rate Limiter
```typescript
const DAILY_BUDGET = 1.00; // USD
let dailySpend = 0;

function estimateCost(inputTokens: number, outputTokens: number): number {
  // Haiku pricing
  return (inputTokens * 0.25 + outputTokens * 1.25) / 1_000_000;
}

async function callWithBudget(prompt: string) {
  const estimatedCost = estimateCost(prompt.length / 4, 150);
  
  if (dailySpend + estimatedCost > DAILY_BUDGET) {
    throw new Error('Daily budget exceeded');
  }
  
  const result = await client.messages.create(...);
  dailySpend += estimateCost(result.usage.input_tokens, result.usage.output_tokens);
  
  return result;
}
```

### Monitoreo de Uso
```typescript
// Log cada request
console.log({
  timestamp: new Date().toISOString(),
  model: 'haiku',
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
  cost: estimateCost(response.usage.input_tokens, response.usage.output_tokens),
  dailyTotal: dailySpend
});
```

## Integración con Otros Agentes

| Agente | Input | Output |
|--------|-------|--------|
| **scraping-automation** | Datos producto | Copywriting |
| **seo-growth** | Keywords | Meta descriptions |
| **affiliate-marketing** | Productos | Comparativas |
| **fullstack-dev** | Textos | Contenido dinámico |
