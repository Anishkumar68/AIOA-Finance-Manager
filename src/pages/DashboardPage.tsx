import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardDivider, CardHeader, InlineError, SectionTitle } from "../components/ui";
import { getAccounts, getCategories, getDashboardSummary } from "../lib/api";
import { formatAmount, toNumber } from "../lib/format";
import {
  ArrowLeftRight,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

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

  const monthIncome = toNumber(summary?.this_month_income);
  const monthSavings = toNumber(summary?.this_month_savings);
  const savingsRate = monthIncome > 0 ? Math.max(0, Math.min(1, monthSavings / monthIncome)) : null;
  const topExpense = [...expenseByCategory]
    .map((x) => ({ name: String(x.category_name ?? "Unknown"), total: toNumber(x.total) }))
    .sort((a, b) => b.total - a.total)[0];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Dashboard"
        subtitle="A bento-style overview of cashflow, spend, and what changed recently."
        right={
          <Button variant="ghost" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <Wallet size={14} className="opacity-70" /> Jump to top
          </Button>
        }
      />

      {error ? <InlineError message={error} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-brand-muted" /> Total balance
              </div>
            }
            description={loading ? "Syncing your latest totals" : "Across active accounts"}
            right={savingsRate != null ? <Badge variant="brand">{Math.round(savingsRate * 100)}% saved</Badge> : null}
          />
          <div className="relative mt-4">
            <div className="text-3xl font-semibold tracking-tight text-text-primary tabular-nums">
              {formatAmount(summary?.total_balance)}
            </div>
            <div className="mt-2 text-xs text-text-muted">
              {topExpense?.total ? (
                <span>
                  Biggest spend: <span className="text-text-secondary">{topExpense.name}</span> ({formatAmount(topExpense.total)})
                </span>
              ) : (
                <span>Track transactions to unlock insights.</span>
              )}
            </div>
          </div>

          <CardDivider />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-border bg-surface-raised/60 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">This month</div>
              <div className="mt-1 text-sm font-semibold text-text-primary tabular-nums">{formatAmount(summary?.this_month_income)}</div>
              <div className="text-xs text-text-muted">Income</div>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-raised/60 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">This month</div>
              <div className="mt-1 text-sm font-semibold text-text-primary tabular-nums">{formatAmount(summary?.this_month_expense)}</div>
              <div className="text-xs text-text-muted">Expense</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          <Card className="sm:col-span-1">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-300" /> Income
                </div>
              }
              description="This month"
            />
            <div className="mt-4 text-2xl font-semibold tracking-tight text-text-primary tabular-nums">
              {formatAmount(summary?.this_month_income)}
            </div>
          </Card>

          <Card className="sm:col-span-1">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <TrendingDown size={16} className="text-red-300" /> Expense
                </div>
              }
              description="This month"
              right={monthExpense ? <Badge variant="muted">{formatAmount(monthExpense)}</Badge> : null}
            />
            <div className="mt-4 text-2xl font-semibold tracking-tight text-text-primary tabular-nums">
              {formatAmount(summary?.this_month_expense)}
            </div>
          </Card>

          <Card className="sm:col-span-1">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <PiggyBank size={16} className="text-brand-muted" /> Savings
                </div>
              }
              description="This month"
            />
            <div className="mt-4 text-2xl font-semibold tracking-tight text-text-primary tabular-nums">
              {formatAmount(summary?.this_month_savings)}
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-7">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-text-secondary" /> Recent transactions
              </div>
            }
            description={loading ? "Loading" : "Last 10"}
          />

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
                <tr className="border-b border-surface-border">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Account</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {(summary?.recent_transactions ?? []).map((t: any) => {
                  const accountName = accountById.get(t.account_id)?.name ?? `#${t.account_id}`;
                  const categoryName = t.category_id ? categoryById.get(t.category_id)?.name ?? `#${t.category_id}` : "—";
                  const type = String(t.type ?? "").toUpperCase();
                  const badge =
                    type === "INCOME" ? (
                      <Badge variant="success">INCOME</Badge>
                    ) : type === "EXPENSE" ? (
                      <Badge variant="danger">EXPENSE</Badge>
                    ) : (
                      <Badge variant="muted">
                        <ArrowLeftRight size={12} className="opacity-70" /> TRANSFER
                      </Badge>
                    );

                  return (
                    <tr key={t.id} className="border-b border-surface-border/70 hover:bg-surface-raised/30">
                      <td className="py-2 pr-3 text-text-muted">{String(t.date ?? "")}</td>
                      <td className="py-2 pr-3">{badge}</td>
                      <td className="py-2 pr-3 text-text-primary">{accountName}</td>
                      <td className="py-2 pr-3">{type === "TRANSFER" ? "Transfer" : categoryName}</td>
                      <td className="py-2 text-right tabular-nums text-text-primary">{formatAmount(t.amount)}</td>
                    </tr>
                  );
                })}
                {!loading && (summary?.recent_transactions ?? []).length === 0 ? (
                  <tr>
                    <td className="py-6 text-sm text-text-muted" colSpan={5}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader
            title="Expense by category"
            description={monthExpense ? `${formatAmount(monthExpense)} total this month` : "This month"}
            right={
              <Badge variant="muted">
                {expenseByCategory.length ? `${expenseByCategory.length} categories` : "No data"}
              </Badge>
            }
          />

          <div className="mt-4 space-y-3">
            {expenseByCategory.map((row: any) => {
              const total = toNumber(row.total);
              const pct = Math.max(0, Math.min(100, (total / expenseMax) * 100));
              return (
                <div key={row.category_id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="truncate text-text-primary">{row.category_name}</div>
                    <div className="tabular-nums text-text-secondary">{formatAmount(total)}</div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-raised">
                    <div className="h-2 rounded-full bg-brand/35" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {!loading && expenseByCategory.length === 0 ? <div className="text-sm text-text-muted">No expenses this month.</div> : null}
          </div>

          <CardDivider />

          <CardHeader title="Account balances" description="Current balance per account" />
          <div className="mt-3 space-y-2">
            {(summary?.account_balances ?? []).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 truncate text-text-primary">
                  {a.name} <span className="text-xs text-text-muted">({a.type})</span>
                  {!a.is_active ? <span className="ml-2 text-xs text-text-faint">archived</span> : null}
                </div>
                <div className="tabular-nums text-text-secondary">{formatAmount(a.current_balance)}</div>
              </div>
            ))}
            {!loading && (summary?.account_balances ?? []).length === 0 ? (
              <div className="text-sm text-text-muted">No accounts yet.</div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
