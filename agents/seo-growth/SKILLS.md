# 📈 SEO & Growth Agent

## Especialización
SEO programático y optimización de conversión para proyectos de afiliados Amazon.

## SEO para Afiliados Amazon

### Keywords de Alta Intención (High Converting)
| Patrón | Ejemplo | Intención |
|--------|---------|-----------|
| `[producto] opiniones` | "airpods pro opiniones" | Investigación |
| `[producto] precio` | "iphone 15 precio" | Comparación |
| `mejor [categoría] 2024` | "mejor aspirador robot 2024" | Decisión |
| `[producto] vs [producto]` | "dyson vs xiaomi" | Comparación |
| `[producto] merece la pena` | "kindle merece la pena" | Validación |
| `[producto] oferta/descuento` | "ps5 oferta" | **Compra** 💰 |

### Long-tail con Menos Competencia
```
"[producto] para [uso específico]"
→ "auriculares para correr con lluvia"

"[producto] alternativa barata"
→ "alternativa barata a roomba"

"[producto] [año] opiniones"
→ "macbook air m3 2024 opiniones"
```

## SEO Técnico

### Meta Tags Template (Next.js)
```typescript
// app/productos/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  
  return {
    title: `${product.name} - Opiniones y Mejor Precio 2024`,
    description: `${product.name} a ${product.price}€. ⭐ ${product.rating}/5 con ${product.reviews} opiniones. Envío Prime. Compara precios y ahorra.`,
    openGraph: {
      title: `${product.name} | Oferta ${product.discount}% dto`,
      description: `Antes ${product.originalPrice}€, ahora ${product.price}€`,
      images: [product.image],
      type: 'product',
    },
    alternates: {
      canonical: `https://tudominio.com/productos/${params.slug}`,
    },
  };
}
```

### Schema Markup (Product)
```typescript
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.title,
  image: product.imageUrl,
  description: product.description,
  brand: {
    '@type': 'Brand',
    name: product.brand,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: product.rating,
    reviewCount: product.reviewCount,
  },
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: affiliateLink,
  },
};
```

### Sitemap Dinámico
```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  
  const productUrls = products.map((p) => ({
    url: `https://tudominio.com/productos/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));
  
  return [
    { url: 'https://tudominio.com', priority: 1 },
    { url: 'https://tudominio.com/ofertas', priority: 0.9 },
    ...productUrls,
  ];
}
```

## SEO Programático

### Escalar a 1000+ Páginas
```
1. Identificar patrón de contenido
   → "Mejores [categoría] baratos"
   
2. Extraer categorías de Amazon (50+)
   → Electrónica, Hogar, Jardín, Moda...

3. Generar páginas automáticamente
   → /mejores-auriculares-baratos
   → /mejores-aspiradoras-baratas
   → /mejores-tablets-baratas

4. Contenido único con IA
   → Intro, tabla comparativa, pros/cons, veredicto
```

### Template de Página Programática
```markdown
# Mejores {categoría} Baratos 2024 (Calidad-Precio)

**Actualizado:** {fecha}
**Productos analizados:** {count}

## Resumen Rápido
| Producto | Precio | Rating | Lo Mejor |
|----------|--------|--------|----------|
[tabla generada]

## Análisis Detallado

### 1. {Producto ganador}
{descripción IA}
**Pros:** ✅ {pros}
**Contras:** ❌ {contras}
[Botón: Ver precio en Amazon]

...
```

## Copywriting de Conversión

### CTAs que Convierten
```
❌ "Comprar ahora"
✅ "Ver precio actual en Amazon"

❌ "Clic aquí"
✅ "Comprobar disponibilidad"

❌ "Enlace"
✅ "Ver 2,847 opiniones en Amazon"
```

### Elementos de Urgencia
```html
<!-- Timer de oferta -->
<div class="urgency">
  ⚡ Oferta termina en 2h 34m
</div>

<!-- Stock limitado -->
<div class="scarcity">
  📦 Solo quedan 3 unidades
</div>

<!-- Social proof -->
<div class="proof">
  👥 847 personas viendo esto ahora
</div>
```

## Analytics y Tracking

### UTM Parameters para Afiliados
```
https://amazon.es/dp/B0ABC123?tag=tuafiliado-21
  &utm_source=web
  &utm_medium=producto
  &utm_campaign=ofertas-flash
  &utm_content=cta-principal
```

### Métricas Clave
| Métrica | Target | Cómo Medir |
|---------|--------|------------|
| CTR (Click-through) | >5% | Clicks / Visitas |
| Conversión | >3% | Ventas / Clicks |
| Bounce Rate | <60% | Analytics |
| Time on Page | >2 min | Analytics |

## Integración con Otros Agentes

| Agente | Colaboración |
|--------|--------------|
| **fullstack-dev** | Implementa SEO técnico |
| **ai-integration** | Genera contenido único |
| **scraping-automation** | Datos para páginas |
| **affiliate-marketing** | Links optimizados |
