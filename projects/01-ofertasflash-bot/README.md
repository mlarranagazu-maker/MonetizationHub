# 🤖 OfertasFlash Bot - Proyecto 1

Bot de Telegram automatizado para publicar ofertas de Amazon y otros proveedores españoles con copywriting generado por IA.

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Ejecutar
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Token de @BotFather | `123456:ABC-DEF...` |
| `TELEGRAM_CHANNEL_ID` | ID del canal/grupo | `@tucanaldeOfertas` o `-1001234567890` |
| `ANTHROPIC_API_KEY` | API Key de Claude | `sk-ant-...` |
| `AMAZON_ES_TAG` | Tag de afiliado Amazon ES | `tuafiliado-21` |

### Variables Opcionales

| Variable | Default | Descripción |
|----------|---------|-------------|
| `MAX_DEALS` | 5 | Máximo ofertas por ejecución |
| `MIN_DISCOUNT` | 30 | Descuento mínimo (%) |
| `CATEGORIES` | electronics,home | Categorías separadas por coma |
| `PROVIDERS` | amazon_es | Proveedores activos |

## 📋 Proveedores Soportados

- ✅ `amazon_es` - Amazon España
- ✅ `amazon_de` - Amazon Alemania  
- ✅ `amazon_fr` - Amazon Francia
- ✅ `elcorteingles` - El Corte Inglés (via Awin)
- ✅ `decathlon` - Decathlon (via Awin)
- ✅ `pccomponentes` - PcComponentes

## 🔄 Automatización

### Cron Job (Linux/Mac)
```bash
# Ejecutar cada 4 horas
0 */4 * * * cd /ruta/proyecto && npm run start >> logs/bot.log 2>&1
```

### GitHub Actions
```yaml
name: Run Bot
on:
  schedule:
    - cron: '0 */4 * * *'
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm start
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHANNEL_ID: ${{ secrets.TELEGRAM_CHANNEL_ID }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          AMAZON_ES_TAG: ${{ secrets.AMAZON_ES_TAG }}
```

## 💰 Costes Estimados

| Componente | Coste | Notas |
|------------|-------|-------|
| Claude Haiku | ~$0.001/oferta | 5 ofertas/día = $0.15/mes |
| Telegram Bot | Gratis | - |
| Hosting | $0-5/mes | Vercel/Railway gratis o VPS básico |
| **Total** | **~$5/mes** | - |

## 📊 Ingresos Estimados (Conservador)

Con 1000 suscriptores y 1% conversión:
- 10 compras/día × $2 comisión media = **$20/día = $600/mes**

ROI: 120x 🚀

## 📁 Estructura

```
ofertasflash-bot/
├── src/
│   ├── index.ts          # Entry point
│   ├── scraper.ts        # Multi-provider scraping
│   ├── ai.ts             # Claude integration
│   ├── telegram.ts       # Telegram bot
│   ├── types.ts          # TypeScript types
│   └── utils/
│       ├── affiliate.ts  # Link generation
│       └── logger.ts     # Logging
├── .env.example
├── .env                  # (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## 🛡️ Compliance

- ⚠️ Usar `#ad` o `#afiliado` en mensajes (requerido FTC/UE)
- ⚠️ No hacer promesas de precios incorrectas
- ⚠️ Respetar ToS de Amazon Associates
- ⚠️ Rate limiting en scraping
