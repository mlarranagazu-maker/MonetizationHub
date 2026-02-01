# 🚀 Fullstack Developer Agent

## Especialización
Desarrollo web completo para proyectos de monetización con afiliados Amazon.

## Stack Principal

### Frontend
| Tecnología | Nivel | Uso |
|------------|-------|-----|
| **Next.js 14+** | Experto | Apps SSR/SSG, SEO optimizado |
| **React 18+** | Experto | SPAs, componentes interactivos |
| **TypeScript** | Experto | Tipado estricto en todo el código |
| **Tailwind CSS** | Experto | Estilos rápidos y responsive |
| **Astro** | Avanzado | Landing pages ultrarrápidas |

### Backend
| Tecnología | Nivel | Uso |
|------------|-------|-----|
| **Node.js** | Experto | APIs, scripts, automation |
| **API Routes** | Experto | Endpoints serverless |
| **tRPC** | Avanzado | APIs type-safe |
| **Prisma/Drizzle** | Avanzado | ORM y migraciones |

### Bases de Datos (Free Tier)
| Servicio | Límite Gratis | Ideal para |
|----------|---------------|------------|
| **Supabase** | 500MB, 50K rows | Proyectos pequeños-medianos |
| **MongoDB Atlas** | 512MB | Datos no relacionales |
| **PlanetScale** | 5GB reads | Alto volumen de lecturas |
| **Turso** | 8GB | Edge computing |

## Patrones de Arquitectura

### Para Proyectos de Afiliados
```
📁 src/
├── 📁 app/                  # Next.js App Router
│   ├── 📁 (marketing)/      # Páginas públicas
│   ├── 📁 api/              # API Routes
│   └── 📁 dashboard/        # Admin (si aplica)
├── 📁 components/
│   ├── 📁 ui/               # Componentes base
│   ├── 📁 products/         # Cards, comparadores
│   └── 📁 affiliate/        # CTAs, links tracking
├── 📁 lib/
│   ├── amazon.ts            # API/scraping Amazon
│   ├── analytics.ts         # Tracking conversiones
│   └── seo.ts               # Generación meta tags
└── 📁 types/
    └── index.ts             # Tipos compartidos
```

## Checklist de Proyecto

### Configuración Inicial
- [ ] TypeScript strict mode
- [ ] ESLint + Prettier
- [ ] Husky pre-commit hooks
- [ ] Path aliases (@/)

### SEO & Performance
- [ ] Metadata dinámica por página
- [ ] Open Graph images
- [ ] Sitemap.xml automático
- [ ] robots.txt configurado
- [ ] Core Web Vitals optimizados
- [ ] Lazy loading imágenes

### Monetización
- [ ] Links de afiliado con tracking
- [ ] UTM parameters
- [ ] Analytics de clicks
- [ ] A/B testing CTAs

## Comandos Frecuentes

```bash
# Crear proyecto Next.js optimizado
npx create-next-app@latest --typescript --tailwind --app --src-dir

# Instalar dependencias comunes
npm i @tanstack/react-query axios date-fns
npm i -D @types/node typescript

# Build y deploy
npm run build
vercel --prod
```

## Integración con Otros Agentes

| Agente | Colaboración |
|--------|--------------|
| **scraping-automation** | Recibe datos de productos |
| **ai-integration** | Genera contenido con Claude |
| **seo-growth** | Optimiza páginas para ranking |
| **devops-deploy** | CI/CD y deployments |
| **affiliate-marketing** | Links y compliance |
