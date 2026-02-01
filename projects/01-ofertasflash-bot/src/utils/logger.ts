// Utilidades de logging con colores

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 1,
  warn: 2,
  error: 3,
};

// Colores ANSI
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL as LogLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

function log(level: LogLevel, color: string, ...args: unknown[]): void {
  if (!shouldLog(level)) return;
  
  const prefix = `${COLORS.gray}[${formatTimestamp()}]${COLORS.reset} ${color}[${level.toUpperCase()}]${COLORS.reset}`;
  console.log(prefix, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', COLORS.gray, ...args),
  info: (...args: unknown[]) => log('info', COLORS.blue, ...args),
  success: (...args: unknown[]) => log('success', COLORS.green, ...args),
  warn: (...args: unknown[]) => log('warn', COLORS.yellow, ...args),
  error: (...args: unknown[]) => log('error', COLORS.red, ...args),
};
