export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthKeyFromDateString(dateStr: string): string | null {
  const normalized = String(dateStr).trim().replace(/-/g, '/');
  const match = normalized.match(/^(\d{4})\/(\d{1,2})/);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, '0')}`;
}

export function formatMonthLabel(monthKey: string): string {
  const parts = monthKey.split(/[-/]/);
  return parts[1]?.padStart(2, '0') ?? monthKey;
}
