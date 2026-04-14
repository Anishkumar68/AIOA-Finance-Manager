import { useEffect, useMemo, useState } from "react";
import { Card, InlineError, SectionTitle } from "../components/ui";
import { getAccounts, getCategories, getDashboardSummary } from "../lib/api";
import { formatAmount, toNumber } from "../lib/format";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, a, c] = await Promise.all([getDashboardSummary(), getAccounts(true), getCategories(undefined, true)]);
        if (cancelled) return;
        setSummary(s);
        setAccounts(a);
        setCategories(c);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ? String(e.message) : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const monthExpense = toNumber(summary?.this_month_expense);
  const expenseByCategory = (summary?.expense_by_category as any[] | undefined) ?? [];
  const expenseMax = Math.max(1, ...expenseByCategory.map((x) => toNumber(x.total)));

  return (
    <div className="space-y-5">
      <SectionTitle title="Dashboard" subtitle="Balance, this month’s totals, and recent activity." />

      {error ? <InlineError message={error} /> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card>
          <div className="text-xs font-medium text-slate-300">Total balance</div>
          <div className="mt-2 text-xl font-semibold text-white">{formatAmount(summary?.total_balance)}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-slate-300">This month income</div>
          <div className="mt-2 text-xl font-semibold text-white">{formatAmount(summary?.this_month_income)}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-slate-300">This month expense</div>
          <div className="mt-2 text-xl font-semibold text-white">{formatAmount(summary?.this_month_expense)}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-slate-300">This month savings</div>
          <div className="mt-2 text-xl font-semibold text-white">{formatAmount(summary?.this_month_savings)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Recent transactions</div>
            <div className="text-xs text-slate-400">{loading ? "Loading…" : "Last 10"}</div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Account</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {(summary?.recent_transactions ?? []).map((t: any) => {
                  const accountName = accountById.get(t.account_id)?.name ?? `#${t.account_id}`;
                  const categoryName = t.category_id ? categoryById.get(t.category_id)?.name ?? `#${t.category_id}` : "—";
                  const type = String(t.type ?? "").toUpperCase();
                  return (
                    <tr key={t.id} className="border-b border-white/5 last:border-b-0">
                      <td className="py-2 pr-3">{String(t.date ?? "")}</td>
                      <td className="py-2 pr-3">{type}</td>
                      <td className="py-2 pr-3">{accountName}</td>
                      <td className="py-2 pr-3">{type === "TRANSFER" ? "Transfer" : categoryName}</td>
                      <td className="py-2 text-right tabular-nums">{formatAmount(t.amount)}</td>
                    </tr>
                  );
                })}
                {!loading && (summary?.recent_transactions ?? []).length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-slate-400" colSpan={5}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Expense by category</div>
            <div className="text-xs text-slate-400">{monthExpense ? `${formatAmount(monthExpense)} total` : "This month"}</div>
          </div>

          <div className="mt-3 space-y-2">
            {expenseByCategory.map((row: any) => {
              const total = toNumber(row.total);
              const pct = Math.max(0, Math.min(100, (total / expenseMax) * 100));
              return (
                <div key={row.category_id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="truncate text-slate-200">{row.category_name}</div>
                    <div className="tabular-nums text-slate-200">{formatAmount(total)}</div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5">
                    <div className="h-2 rounded-full bg-white/20" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {!loading && expenseByCategory.length === 0 ? <div className="text-sm text-slate-400">No expenses this month.</div> : null}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-sm font-semibold text-white">Account balances</div>
            <div className="mt-3 space-y-2">
              {(summary?.account_balances ?? []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="truncate text-slate-200">
                    {a.name} <span className="text-xs text-slate-400">({a.type})</span>
                    {!a.is_active ? <span className="ml-2 text-xs text-slate-500">archived</span> : null}
                  </div>
                  <div className="tabular-nums text-slate-200">{formatAmount(a.current_balance)}</div>
                </div>
              ))}
              {!loading && (summary?.account_balances ?? []).length === 0 ? (
                <div className="text-sm text-slate-400">No accounts yet.</div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
