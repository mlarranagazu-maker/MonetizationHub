# 💰 Affiliate Marketing Agent

## Especialización
Gestión de programas de afiliados Amazon, compliance legal y optimización de conversiones.

## Amazon Associates España

### Comisiones por Categoría (2024)
| Categoría | Comisión | Ticket Medio | Potencial |
|-----------|----------|--------------|-----------|
| Moda, Zapatos, Accesorios | 10% | 50€ | ⭐⭐⭐⭐⭐ |
| Productos Amazon (Kindle, Echo) | 7% | 100€ | ⭐⭐⭐⭐ |
| Hogar, Jardín | 7% | 60€ | ⭐⭐⭐⭐ |
| Deportes, Outdoors | 6% | 70€ | ⭐⭐⭐ |
| Belleza, Salud | 6% | 30€ | ⭐⭐⭐ |
| Electrónica, Ordenadores | 3% | 200€ | ⭐⭐ |
| Videojuegos, Consolas | 1% | 60€ | ⭐ |

### Estructura de Link de Afiliado
```
https://www.amazon.es/dp/B0ABC123XY?tag=tuafiliado-21

Componentes:
- Base: amazon.es/dp/
- ASIN: B0ABC123XY (identificador producto)
- Tag: tuafiliado-21 (tu ID de afiliado)
```

### Links Especiales
```
# Búsqueda con afiliado
https://www.amazon.es/s?k=auriculares+bluetooth&tag=tuafiliado-21

# Añadir al carrito (mayor conversión)
https://www.amazon.es/gp/aws/cart/add.html?ASIN.1=B0ABC123&Quantity.1=1&tag=tuafiliado-21

# Página de ofertas
https://www.amazon.es/gp/goldbox?tag=tuafiliado-21
```

## Compliance Obligatorio

### ⚠️ Disclaimer de Afiliados (Obligatorio)
```html
<!-- En el footer o cerca de links -->
<p class="affiliate-disclosure">
  Como Afiliado de Amazon, obtengo ingresos por las compras adscritas 
  que cumplen los requisitos aplicables. Los precios y disponibilidad 
  pueden variar.
</p>
```

### Política de Privacidad (Mínimo)
```markdown
## Enlaces de Afiliados

Este sitio participa en el Programa de Afiliados de Amazon EU, 
un programa de publicidad para afiliados diseñado para ofrecer 
a sitios web un modo de obtener comisiones por publicidad, 
publicitando e incluyendo enlaces a Amazon.es.

Amazon y el logo de Amazon son marcas registradas de Amazon.com, 
Inc. o de sus afiliados.
```

### ❌ Lo que NO Puedes Hacer
```
1. Enviar links de afiliado por email directo
2. Usar links en apps móviles sin aprobación
3. Manipular cookies o usar pop-unders
4. Afirmar "precio más bajo garantizado"
5. Usar logos Amazon sin permiso
6. Hacer claims de earnings específicos
7. Incentivar clicks (ej: "haz click y participa en sorteo")
8. Ocultar que son links de afiliado
```

## Generación de Links

### TypeScript Utility
```typescript
const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'tuafiliado-21';

interface AffiliateLink {
  productUrl: string;
  searchUrl: string;
  addToCartUrl: string;
}

function generateAffiliateLinks(asin: string): AffiliateLink {
  return {
    productUrl: `https://www.amazon.es/dp/${asin}?tag=${AMAZON_TAG}`,
    searchUrl: `https://www.amazon.es/s?k=${asin}&tag=${AMAZON_TAG}`,
    addToCartUrl: `https://www.amazon.es/gp/aws/cart/add.html?ASIN.1=${asin}&Quantity.1=1&tag=${AMAZON_TAG}`,
  };
}

// Con UTM tracking adicional
function generateTrackedLink(asin: string, source: string, campaign: string): string {
  const baseUrl = `https://www.amazon.es/dp/${asin}`;
  const params = new URLSearchParams({
    tag: AMAZON_TAG,
    utm_source: source,
    utm_medium: 'affiliate',
    utm_campaign: campaign,
  });
  return `${baseUrl}?${params.toString()}`;
}
```

## Tracking y Analytics

### Métricas Clave
| Métrica | Fórmula | Target |
|---------|---------|--------|
| **CTR** | Clicks / Impresiones | >3% |
| **Conversión** | Ventas / Clicks | >2% |
| **EPC** | Ganancias / Clicks | >0.10€ |
| **AOV** | Ingresos / Ventas | >40€ |

### Dashboard de Tracking
```typescript
interface AffiliateStats {
  date: Date;
  clicks: number;
  orders: number;
  items: number;
  revenue: number;
  commission: number;
}

// Log cada click
async function trackClick(link: string, source: string) {
  await db.insert('affiliate_clicks', {
    link,
    source,
    timestamp: new Date(),
    userAgent: req.headers['user-agent'],
    referrer: req.headers['referer'],
  });
}
```

## Estrategias de Conversión

### 1. Comparativas Honestas
```markdown
## Pros ✅
- Batería de 30 horas
- Cancelación de ruido activa
- Compatible con todos los dispositivos

## Contras ❌
- Precio elevado
- Estuche algo grande
- Sin carga inalámbrica

## Veredicto
Si buscas calidad de sonido premium y usas auriculares +4h/día,
merece la inversión. Si tu presupuesto es limitado, considera [alternativa].
```

### 2. Tablas Comparativas
```html
<table>
  <tr>
    <th>Característica</th>
    <th>Producto A</th>
    <th>Producto B</th>
    <th>Ganador</th>
  </tr>
  <tr>
    <td>Precio</td>
    <td>199€</td>
    <td>149€</td>
    <td>🏆 B</td>
  </tr>
  <!-- ... -->
</table>
```

### 3. CTAs Efectivos
```tsx
// ❌ Malo
<a href={link}>Comprar</a>

// ✅ Bueno
<a href={link} className="cta-button">
  Ver precio en Amazon
  <span className="price">{price}€</span>
  <span className="rating">⭐ {rating}/5 ({reviews} opiniones)</span>
</a>
```

### 4. Urgencia Real
```tsx
// Solo mostrar si hay oferta real
{deal.isActive && (
  <div className="urgency-banner">
    🔥 Oferta -{deal.discount}% termina en {deal.timeLeft}
  </div>
)}
```

## Nichos Rentables (España)

### Alto Potencial
```
1. Tecnología del hogar (robots aspiradores, domótica)
2. Fitness y deporte (equipamiento, suplementos)
3. Gaming (periféricos, sillas)
4. Maternidad (carritos, productos bebé)
5. Mascotas (comida, accesorios)
```

### Temporadas Clave
```
📅 Calendario de picos:

Enero: Rebajas de invierno, fitness (propósitos)
Febrero: San Valentín
Marzo-Abril: Primavera, jardín
Mayo-Junio: Día de la Madre/Padre
Julio: Prime Day 🔥🔥🔥
Septiembre: Vuelta al cole
Noviembre: Black Friday 🔥🔥🔥🔥🔥
Diciembre: Navidad, regalos
```

## Integración con Otros Agentes

| Agente | Colaboración |
|--------|--------------|
| **scraping-automation** | Extrae productos para promocionar |
| **ai-integration** | Genera copy persuasivo |
| **seo-growth** | Posiciona páginas de producto |
| **fullstack-dev** | Implementa tracking |
