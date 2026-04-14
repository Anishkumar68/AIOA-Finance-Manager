import { getAccounts, getCategories, getTransactions, type Transaction } from "./api";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsvRow(cols: unknown[]) {
  return cols.map(csvEscape).join(",");
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function exportTransactionsCsv() {
  const MAX_ITEMS = 10_000;
  const limit = 200;

  const [accounts, categories] = await Promise.all([
    getAccounts(true).catch(() => []),
    getCategories(undefined, true).catch(() => [])
  ]);
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const items: Transaction[] = [];
  let page = 1;
  let pages = 1;

  while (page <= pages) {
    const res = await getTransactions({ page, limit });
    items.push(...res.items);
    pages = res.pages;
    page += 1;
    if (items.length > MAX_ITEMS) throw new Error(`Too many transactions to export (${items.length}+). Narrow your data first.`);
  }

  const header = [
    "id",
    "date",
    "type",
    "amount",
    "account",
    "account_id",
    "category",
    "category_id",
    "transfer_account",
    "transfer_account_id",
    "note",
    "reference"
  ];

  const lines: string[] = [];
  lines.push(toCsvRow(header));

  for (const t of items) {
    const account = accountById.get(t.account_id);
    const category = t.category_id ? categoryById.get(t.category_id) : null;
    const transferAccount = t.transfer_account_id ? accountById.get(t.transfer_account_id) : null;

    lines.push(
      toCsvRow([
        t.id,
        t.date,
        t.type,
        t.amount,
        account?.name ?? "",
        t.account_id,
        category?.name ?? "",
        t.category_id ?? "",
        transferAccount?.name ?? "",
        t.transfer_account_id ?? "",
        t.note ?? "",
        t.reference ?? ""
      ])
    );
  }

  downloadText(`transactions-${todayYmd()}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
}

