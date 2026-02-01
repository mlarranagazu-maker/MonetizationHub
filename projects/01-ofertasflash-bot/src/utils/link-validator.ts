// 🔗 Link Validator - Validación automática de enlaces antes de publicar
// Garantiza que todos los productos tienen links funcionales

import { logger } from './logger.js';

export interface ValidationResult {
  asin: string;
  isValid: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

export interface ProductValidation {
  name: string;
  asin: string;
  url: string;
  isValid: boolean;
  error?: string;
}

/**
 * Valida si un producto de Amazon existe y está disponible
 */
export async function validateAmazonProduct(asin: string): Promise<ValidationResult> {
  const url = `https://www.amazon.es/dp/${asin}`;
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    
    // Amazon devuelve 200 para productos existentes
    // Devuelve 404 o redirecciona a búsqueda para productos inexistentes
    const isValid = response.ok && response.status === 200;
    
    return {
      asin,
      isValid,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    return {
      asin,
      isValid: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Valida múltiples productos en paralelo
 */
export async function validateProducts(
  products: Array<{ name: string; asin: string }>
): Promise<ProductValidation[]> {
  logger.info('🔍 Validando enlaces de productos...\n');
  
  const results: ProductValidation[] = [];
  
  // Validar en lotes de 3 para no sobrecargar
  const batchSize = 3;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (product) => {
        const validation = await validateAmazonProduct(product.asin);
        const url = `https://www.amazon.es/dp/${product.asin}`;
        
        if (validation.isValid) {
          logger.info(`   ✅ ${product.name.substring(0, 40)}...`);
        } else {
          logger.error(`   ❌ ${product.name.substring(0, 40)}... (${validation.error || 'No disponible'})`);
        }
        
        return {
          name: product.name,
          asin: product.asin,
          url,
          isValid: validation.isValid,
          error: validation.error,
        };
      })
    );
    
    results.push(...batchResults);
    
    // Pequeña pausa entre lotes
    if (i + batchSize < products.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.filter(r => !r.isValid).length;
  
  logger.info(`\n📊 Resultado: ${validCount} válidos, ${invalidCount} inválidos`);
  
  return results;
}

/**
 * Filtra productos y devuelve solo los válidos
 */
export async function filterValidProducts<T extends { name: string; asin: string }>(
  products: T[]
): Promise<T[]> {
  const validations = await validateProducts(products);
  
  const validAsins = new Set(
    validations.filter(v => v.isValid).map(v => v.asin)
  );
  
  return products.filter(p => validAsins.has(p.asin));
}

/**
 * Genera un reporte de validación
 */
export function generateValidationReport(validations: ProductValidation[]): string {
  const valid = validations.filter(v => v.isValid);
  const invalid = validations.filter(v => !v.isValid);
  
  let report = `\n${'='.repeat(50)}\n`;
  report += `📋 REPORTE DE VALIDACIÓN DE ENLACES\n`;
  report += `${'='.repeat(50)}\n\n`;
  
  report += `✅ Productos válidos: ${valid.length}\n`;
  report += `❌ Productos inválidos: ${invalid.length}\n`;
  report += `📊 Tasa de éxito: ${Math.round((valid.length / validations.length) * 100)}%\n\n`;
  
  if (invalid.length > 0) {
    report += `⚠️ PRODUCTOS CON PROBLEMAS:\n`;
    report += `${'-'.repeat(40)}\n`;
    invalid.forEach(p => {
      report += `  • ${p.name}\n`;
      report += `    ASIN: ${p.asin}\n`;
      report += `    Error: ${p.error || 'Producto no encontrado'}\n\n`;
    });
  }
  
  return report;
}
