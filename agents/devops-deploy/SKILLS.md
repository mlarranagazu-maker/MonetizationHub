# 🚀 DevOps & Deploy Agent

## Especialización
CI/CD, deployments y optimización de infraestructura con coste $0 usando free tiers.

## Plataformas de Hosting (Free Tier)

### Comparativa
| Plataforma | Bandwidth | Build | Funciones | Mejor Para |
|------------|-----------|-------|-----------|------------|
| **Vercel** | 100GB | 6000 min | Serverless | Next.js apps |
| **Netlify** | 100GB | 300 min | Serverless | Static + forms |
| **GitHub Pages** | ∞ | N/A | N/A | Blogs, docs |
| **Cloudflare Pages** | ∞ | 500 builds | Workers | Performance |

### Límites Detallados

#### Vercel (Hobby)
```
✅ 100 GB bandwidth/mes
✅ Serverless: 100GB-hrs, 100K invocaciones
✅ Edge Functions: 500K invocaciones
✅ Analytics básico
✅ Preview deploys ilimitados
❌ 1 dominio custom por proyecto
❌ Sin team features
```

#### Netlify (Free)
```
✅ 100 GB bandwidth/mes
✅ 300 build minutes/mes
✅ 125K serverless invocaciones
✅ Forms: 100 submissions/mes
✅ Identity: 1000 usuarios
❌ Sin analytics avanzado
```

#### GitHub Pages
```
✅ Bandwidth ilimitado (repos públicos)
✅ 1 GB de almacenamiento
✅ Custom domains + HTTPS
✅ GitHub Actions para build
❌ Solo contenido estático
❌ No serverless functions
```

## GitHub Actions Workflows

### Deploy a Vercel
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Deploy a GitHub Pages (Astro/Static)
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - run: npm ci
      - run: npm run build
      
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### Cron Job (Bot de Ofertas)
```yaml
name: Scrape and Post
on:
  schedule:
    - cron: '*/30 * * * *'  # Cada 30 min
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      - run: npm run scrape
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
```

## Configuración de Proyectos

### Vercel (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["mad1"],
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 */6 * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### Netlify (netlify.toml)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

## Environment Variables

### Secretos en GitHub
```bash
# Configurar secrets
gh secret set VERCEL_TOKEN --body "xxx"
gh secret set ANTHROPIC_API_KEY --body "sk-ant-xxx"
gh secret set TELEGRAM_BOT_TOKEN --body "123456:ABC..."
```

### .env.example Template
```env
# AI
ANTHROPIC_API_KEY=sk-ant-api-xxx

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNO
TELEGRAM_CHAT_ID=-1001234567890

# Amazon (opcional)
AMAZON_ASSOCIATE_TAG=tuafiliado-21

# Database (opcional)
DATABASE_URL=postgresql://...

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXX
```

## Monitoreo

### Uptime con GitHub Actions
```yaml
name: Uptime Check
on:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check site health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://tudominio.com)
          if [ $response != "200" ]; then
            echo "Site down! Status: $response"
            exit 1
          fi
```

### Alertas Telegram
```typescript
async function alertAdmin(message: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text: `🚨 ALERTA: ${message}`,
      parse_mode: 'HTML'
    })
  });
}
```

## Estrategia de Costes $0

### Distribución Óptima
```
📊 Proyecto típico de afiliados:

Frontend (Next.js)     → Vercel Free      ✅
Landing estáticas      → GitHub Pages     ✅
Bot/Cron jobs          → GitHub Actions   ✅
CDN/Cache              → Cloudflare Free  ✅
Database               → Supabase Free    ✅
Analytics              → Vercel/Plausible ✅
Monitoreo              → UptimeRobot Free ✅

Total: $0/mes (hasta ~50K visitas)
```

## Integración con Otros Agentes

| Agente | Colaboración |
|--------|--------------|
| **fullstack-dev** | Deploy de apps |
| **scraping-automation** | Cron jobs |
| **seo-growth** | CDN, performance |
