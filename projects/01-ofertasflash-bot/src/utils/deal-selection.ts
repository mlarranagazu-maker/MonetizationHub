import { BotConfig, Deal } from '../types.js';
import { computeDealFingerprint } from './deal-fingerprint.js';
import { DealHistory } from './deal-history.js';

export interface DealSelectionReport {
  inputCount: number;
  uniqueCount: number;
  filteredByHistory: number;
  filteredByRules: number;
  selectedCount: number;
}

function parseCsvEnv(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleMatchesAny(title: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const normalized = normalizeText(title);
  return tokens.some(t => normalized.includes(normalizeText(t)));
}

function getNumberEnv(name: string, fallback: number): number {
  const v = parseFloat(process.env[name] || '');
  return Number.isFinite(v) ? v : fallback;
}

function isAllowAll(list: string[]): boolean {
  return list.length === 0 || list.includes('*') || list.includes('all');
}

function computeScore(deal: Deal): number {
  const discount = Number.isFinite(deal.discount) ? deal.discount : 0;
  const price = Number.isFinite(deal.currentPrice) ? deal.currentPrice : 0;
  const original = Number.isFinite(deal.originalPrice) ? deal.originalPrice : price;
  const savings = Math.max(0, original - price);

  const savingsScore = Math.log10(1 + savings) * 12;
  const discountScore = Math.max(0, discount) * 1.4;

  const minPriceEur = getNumberEnv('MIN_PRICE_EUR', 15);
  const pricePenalty = price > 0
    ? Math.max(0, (minPriceEur - Math.min(minPriceEur, price)) / minPriceEur) * 10
    : 10;

  const providerBoost = deal.provider === 'amazon_es' ? 3 : deal.provider === 'pccomponentes' ? 2 : 0;
  const categoryBoost = deal.category === 'electronics' ? 1 : deal.category === 'gaming' ? 0.5 : 0;

  const urlBoost = deal.affiliateLink && deal.affiliateLink.startsWith('http') ? 2 : 0;

  return discountScore + savingsScore + providerBoost + categoryBoost + urlBoost - pricePenalty;
}

export function selectDealsForPublishing(
  rawDeals: Deal[],
  botConfig: BotConfig,
  history: DealHistory
): { selected: Deal[]; report: DealSelectionReport } {
  const maxPerProvider = Math.max(1, Math.floor(getNumberEnv('MAX_PER_PROVIDER', 2)));
  const maxPerCategory = Math.max(1, Math.floor(getNumberEnv('MAX_PER_CATEGORY', 2)));
  const minSavingsEur = getNumberEnv('MIN_ABSOLUTE_SAVINGS_EUR', 10);
  const minPriceEur = getNumberEnv('MIN_PRICE_EUR', 15);
  const allowPriceZero = (process.env.ALLOW_PRICE_ZERO || '').toLowerCase() === 'true';

  const blacklist = parseCsvEnv('TITLE_BLACKLIST');
  const whitelist = parseCsvEnv('TITLE_WHITELIST');

  const now = Date.now();

  const allowedProviders = botConfig.providers.map(p => p.trim()).filter(Boolean);
  const allowedCategories = botConfig.categories.map(c => c.trim()).filter(Boolean);
  const allowAllProviders = isAllowAll(allowedProviders);
  const allowAllCategories = isAllowAll(allowedCategories);
  const allowedProvidersSet = new Set(allowedProviders);
  const allowedCategoriesSet = new Set(allowedCategories);

  const uniqueByFp = new Map<string, Deal>();
  for (const d of rawDeals) {
    const fp = computeDealFingerprint(d);
    if (!uniqueByFp.has(fp)) {
      uniqueByFp.set(fp, d);
    }
  }

  const uniqueDeals = [...uniqueByFp.entries()].map(([fp, deal]) => ({ fp, deal }));

  const filteredHistory = uniqueDeals.filter(({ fp }) => !history.isRecentlySent(fp, now));

  const filteredByRules = filteredHistory.filter(({ deal }) => {
    if (!deal.title || deal.title.trim().length < 12) return false;
    if (titleMatchesAny(deal.title, blacklist)) return false;

    if (!allowAllProviders && !allowedProvidersSet.has(deal.provider)) return false;
    if (!allowAllCategories && !allowedCategoriesSet.has(deal.category)) return false;

    const price = Number.isFinite(deal.currentPrice) ? deal.currentPrice : 0;
    const original = Number.isFinite(deal.originalPrice) ? deal.originalPrice : 0;
    const savings = Math.max(0, original - price);

    if (!allowPriceZero && price <= 0) return false;

    if (deal.discount < botConfig.minDiscount) return false;
    if (price > 0 && price < minPriceEur) return false;
    if (price > 0 && savings > 0 && savings < minSavingsEur) return false;

    if (whitelist.length > 0 && !titleMatchesAny(deal.title, whitelist)) return false;

    return true;
  });

  const scored = filteredByRules
    .map(({ deal }) => ({ deal, score: computeScore(deal) }))
    .sort((a, b) => b.score - a.score);

  const perProvider = new Map<string, number>();
  const perCategory = new Map<string, number>();

  const selected: Deal[] = [];

  for (const item of scored) {
    if (selected.length >= botConfig.maxDeals) break;

    const providerCount = perProvider.get(item.deal.provider) || 0;
    if (providerCount >= maxPerProvider) continue;

    const categoryCount = perCategory.get(item.deal.category) || 0;
    if (categoryCount >= maxPerCategory) continue;

    perProvider.set(item.deal.provider, providerCount + 1);
    perCategory.set(item.deal.category, categoryCount + 1);
    selected.push(item.deal);
  }

  const report: DealSelectionReport = {
    inputCount: rawDeals.length,
    uniqueCount: uniqueByFp.size,
    filteredByHistory: uniqueByFp.size - filteredHistory.length,
    filteredByRules: filteredHistory.length - filteredByRules.length,
    selectedCount: selected.length,
  };

  return { selected, report };
}
