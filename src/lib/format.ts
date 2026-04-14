export function toNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatAmount(v: string | number | null | undefined, currency?: string) {
  const value = toNumber(v);
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
    } catch {
      // fall through
    }
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function isoMonthStart(ym: string) {
  // `YYYY-MM` -> `YYYY-MM-01`
  if (!/^\d{4}-\d{2}$/.test(ym)) return "";
  return `${ym}-01`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

