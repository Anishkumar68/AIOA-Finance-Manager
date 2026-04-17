import { useEffect, useState } from "react";
import { Button, Card, Field, InlineError, Input, SectionTitle } from "../components/ui";
import { getAccountBalances, getCategoryExpense, getMonthlySummary } from "../lib/api";
import { formatAmount, isoMonthStart, toNumber } from "../lib/format";

export default function ReportsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [monthly, setMonthly] = useState<any | null>(null);
  const [categoryReport, setCategoryReport] = useState<any | null>(null);
  const [accountReport, setAccountReport] = useState<any | null>(null);

  const monthIso = isoMonthStart(month);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [m, c, a] = await Promise.all([getMonthlySummary(monthIso), getCategoryExpense(monthIso), getAccountBalances()]);
      setMonthly(m);
      setCategoryReport(c);
      setAccountReport(a);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthIso]);

  return (
    <div className="space-y-5">
        <SectionTitle
          title="Reports"
          subtitle="Monthly summary, category expense, and account balances."
          right={
            <Field label="Month">
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full sm:w-44" />
            </Field>
          }
        />

      {error ? <InlineError message={error} /> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-text-primary">Monthly summary</div>
            <Button variant="ghost" type="button" disabled={loading} onClick={load}>
              Refresh
            </Button>
          </div>
          <div className="mt-3 space-y-2 text-sm text-text-secondary">
            <div className="flex items-center justify-between gap-3">
              <div className="text-text-muted">Income</div>
              <div className="tabular-nums text-text-primary">{formatAmount(monthly?.total_income)}</div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-text-muted">Expense</div>
              <div className="tabular-nums text-text-primary">{formatAmount(monthly?.total_expense)}</div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-surface-border pt-2">
              <div className="text-text-muted">Net savings</div>
              <div className="tabular-nums text-text-primary">{formatAmount(monthly?.net_savings)}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold text-text-primary">Category expense</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
                <tr className="border-b border-surface-border">
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Count</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {(categoryReport?.categories ?? []).map((r: any) => (
                  <tr key={r.category_id} className="border-b border-surface-border/70 last:border-b-0 hover:bg-surface-raised/30">
                    <td className="py-2 pr-3 text-text-primary">{r.category_name}</td>
                    <td className="py-2 pr-3 tabular-nums text-text-muted">{r.transaction_count}</td>
                    <td className="py-2 text-right tabular-nums text-text-primary">{formatAmount(r.total_spent)}</td>
                  </tr>
                ))}
                {!loading && (categoryReport?.categories ?? []).length === 0 ? (
                  <tr>
                    <td className="py-6 text-sm text-text-muted" colSpan={3}>
                      No expense categories found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold text-text-primary">Account balances</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
              <tr className="border-b border-surface-border">
                <th className="py-2 pr-3 font-medium">Account</th>
                <th className="py-2 pr-3 font-medium hidden sm:table-cell">Type</th>
                <th className="py-2 pr-3 font-medium hidden sm:table-cell">Status</th>
                <th className="py-2 pr-3 font-medium hidden md:table-cell">Txns</th>
                <th className="py-2 text-right font-medium">Opening</th>
                <th className="py-2 text-right font-medium">Current</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {(accountReport?.accounts ?? []).map((a: any) => (
                <tr key={a.account_id} className="border-b border-surface-border/70 last:border-b-0 hover:bg-surface-raised/30">
                  <td className="py-2 pr-3 text-text-primary">{a.account_name}</td>
                  <td className="py-2 pr-3 hidden sm:table-cell">{a.account_type}</td>
                  <td className="py-2 pr-3 hidden sm:table-cell">{a.is_active ? "active" : "archived"}</td>
                  <td className="py-2 pr-3 tabular-nums text-text-muted hidden md:table-cell">{a.transaction_count}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{formatAmount(a.opening_balance)}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{formatAmount(a.current_balance)}</td>
                </tr>
              ))}
              {!loading && (accountReport?.accounts ?? []).length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-text-muted" colSpan={6}>
                    No accounts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {!loading && accountReport?.accounts ? (
          <div className="mt-3 text-xs text-text-muted">
            Total current:{" "}
            <span className="tabular-nums text-text-secondary">
              {formatAmount((accountReport.accounts as any[]).reduce((s, a) => s + toNumber(a.current_balance), 0))}
            </span>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
