# 🚀 MonetizationHub - Centro de Agentes IA para Monetización

Sistema de agentes especializados para crear proyectos de monetización digital con enfoque en afiliación, automatización e IA.

## 📊 Estado del Proyecto

| Componente | Estado | Descripción |
|------------|--------|-------------|
| Agentes | ✅ Completo | 10 agentes especializados |
| Templates | ✅ Completo | Bot Telegram starter |
| Proyecto 1 | ✅ Listo | OfertasFlash Bot |

## 🤖 Agentes Disponibles

### Core Development
| Agente | Función |
|--------|---------|
| `fullstack-dev` | Desarrollo web Next.js/React/Node |
| `scraping-automation` | Web scraping con Puppeteer/Cheerio |
| `ai-integration` | Integración Claude AI |
| `devops-deploy` | CI/CD, Docker, Vercel |

### Marketing & SEO
| Agente | Función |
|--------|---------|
| `seo-growth` | Optimización SEO, keywords |
| `affiliate-marketing` | Estrategias de afiliación |

### Internacionalización
| Agente | Función |
|--------|---------|
| `amazon-international` | Amazon EU multi-país (ES/DE/FR/IT/UK) |
| `spanish-affiliates` | El Corte Inglés, Decathlon, PcComponentes... |
| `content-translator` | Localización multi-idioma |

### Legal & Fiscal
| Agente | Función |
|--------|---------|
| `tax-legal-advisor` | Hacienda, Seguridad Social, autónomos |

## 📁 Estructura

```
MonetizationHub/
├── agents/                    # Agentes especializados
│   ├── affiliate-marketing/
│   ├── ai-integration/
│   ├── amazon-international/
│   ├── content-translator/
│   ├── devops-deploy/
│   ├── fullstack-dev/
│   ├── scraping-automation/
│   ├── seo-growth/
│   ├── spanish-affiliates/
│   └── tax-legal-advisor/
├── templates/                 # Plantillas reutilizables
│   └── telegram-bot-starter/
└── projects/                  # Proyectos activos
    └── 01-ofertasflash-bot/   # ← PRIMER PROYECTO
```

## 🎯 Proyecto 1: OfertasFlash Bot

Bot de Telegram que:
1. **Scrapea** ofertas de Amazon ES/DE/FR, El Corte Inglés, Decathlon
2. **Genera** copywriting persuasivo con Claude Haiku
3. **Publica** automáticamente en canal de Telegram
4. **Monetiza** con links de afiliado

### Quick Start
```bash
cd projects/01-ofertasflash-bot
npm install
cp .env.example .env  # Configurar credenciales
npm run dev
```

### Credenciales Necesarias
- Token de bot Telegram (@BotFather)
- API Key Anthropic (Claude)
- Tags de afiliado Amazon
- Publisher ID de Awin (opcional)

### Ingresos Estimados
| Métrica | Valor |
|---------|-------|
| Suscriptores objetivo | 1,000 |
| Conversión esperada | 1% |
| Comisión media | 2€ |
| Ingresos/mes | ~600€ |

## 💡 Próximos Proyectos

1. **Web Comparador SEO** - Astro + contenido AI
2. **API Agregador** - Backend ofertas multi-proveedor
3. **Dashboard Analytics** - Métricas de conversión
4. **Bot Multi-idioma** - Expansión a DE/FR

## ⚖️ Consideraciones Legales

### Fiscalidad España
- Ingresos < SMI: Declarar en IRPF, alta autónomo discrecional
- Ingresos > SMI: Alta autónomo obligatoria
- Modelo 130: Pago fraccionado trimestral
- Amazon Luxembourg: Exento IVA (exportación servicios)

### Compliance
- Etiquetar contenido como #publicidad o #afiliado
- Respetar ToS de cada programa de afiliados
- GDPR en cookies y tracking

---

**Creado con MonetizationHub** 🚀
