import { promises as fs } from 'fs';
import path from 'path';
import { Deal } from '../types.js';
import { computeDealFingerprint } from './deal-fingerprint.js';

export interface DealHistoryEntry {
  fingerprint: string;
  firstSeenAt: string;
  lastSentAt: string;
  sentCount: number;
  lastTitle?: string;
  lastProvider?: string;
  lastCategory?: string;
  lastPrice?: number;
  lastDiscount?: number;
}

export interface DealHistoryFile {
  version: number;
  updatedAt: string;
  entries: Record<string, DealHistoryEntry>;
}

export class DealHistory {
  private filePath: string;
  private ttlMs: number;
  private data: DealHistoryFile;

  constructor(filePath: string, ttlDays: number) {
    this.filePath = filePath;
    this.ttlMs = Math.max(1, ttlDays) * 24 * 60 * 60 * 1000;
    this.data = {
      version: 1,
      updatedAt: new Date(0).toISOString(),
      entries: {},
    };
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as DealHistoryFile;
      if (!parsed || typeof parsed !== 'object' || !parsed.entries) {
        return;
      }
      this.data = {
        version: typeof parsed.version === 'number' ? parsed.version : 1,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
        entries: typeof parsed.entries === 'object' && parsed.entries ? parsed.entries : {},
      };
      this.purgeExpired();
    } catch {
      // First run or unreadable file: start clean
    }
  }

  async save(): Promise<void> {
    this.purgeExpired();
    this.data.updatedAt = new Date().toISOString();

    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  get size(): number {
    return Object.keys(this.data.entries).length;
  }

  isRecentlySent(fingerprint: string, now = Date.now()): boolean {
    const entry = this.data.entries[fingerprint];
    if (!entry) return false;
    const last = Date.parse(entry.lastSentAt);
    if (!Number.isFinite(last)) return false;
    return now - last < this.ttlMs;
  }

  markSent(deal: Deal, now = new Date()): string {
    const fingerprint = computeDealFingerprint(deal);
    const iso = now.toISOString();

    const existing = this.data.entries[fingerprint];
    if (existing) {
      this.data.entries[fingerprint] = {
        ...existing,
        lastSentAt: iso,
        sentCount: (existing.sentCount || 0) + 1,
        lastTitle: deal.title,
        lastProvider: deal.provider,
        lastCategory: deal.category,
        lastPrice: deal.currentPrice,
        lastDiscount: deal.discount,
      };
    } else {
      this.data.entries[fingerprint] = {
        fingerprint,
        firstSeenAt: iso,
        lastSentAt: iso,
        sentCount: 1,
        lastTitle: deal.title,
        lastProvider: deal.provider,
        lastCategory: deal.category,
        lastPrice: deal.currentPrice,
        lastDiscount: deal.discount,
      };
    }

    return fingerprint;
  }

  purgeExpired(now = Date.now()): void {
    const entries = this.data.entries;
    for (const [fp, entry] of Object.entries(entries)) {
      const last = Date.parse(entry.lastSentAt);
      if (!Number.isFinite(last)) {
        delete entries[fp];
        continue;
      }
      if (now - last >= this.ttlMs) {
        delete entries[fp];
      }
    }
  }
}

export async function loadDealHistoryFromEnv(): Promise<DealHistory> {
  const historyPath = process.env.DEAL_HISTORY_PATH || 'data/deal-history.json';
  const ttlDays = parseInt(process.env.DEAL_REPEAT_WINDOW_DAYS || '14');

  const resolvedPath = path.resolve(process.cwd(), historyPath);
  const history = new DealHistory(resolvedPath, Number.isFinite(ttlDays) ? ttlDays : 14);
  await history.load();
  return history;
}
