import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, Field, InlineError, Input, SectionTitle, Select } from "../components/ui";
import { createBudget, deleteBudget, getBudgets, getCategories, updateBudget } from "../lib/api";
import { formatAmount, isoMonthStart, toNumber } from "../lib/format";

export default function BudgetsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("0");

  const [editingId, setEditingId] = useState<number | null>(null);
  const editing = useMemo(() => items.find((x) => x.budget_id === editingId) ?? null, [items, editingId]);
  const [editAmount, setEditAmount] = useState("0");

  const monthIso = isoMonthStart(month);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [data, cats] = await Promise.all([getBudgets(monthIso), getCategories("expense", true)]);
      setItems(data);
      setCategories(cats.filter((c) => c.is_active));
      if (!categoryId && cats.length) setCategoryId(String(cats.find((c) => c.is_active)?.id ?? cats[0].id));
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthIso]);

  useEffect(() => {
    if (!editing) return;
    setEditAmount(String(editing.limit_amount ?? "0"));
  }, [editing]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createBudget({ category_id: Number(categoryId), month: monthIso, amount: Number(amount) });
      setAmount("0");
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to create budget");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setBusy(true);
    setError(null);
    try {
      await updateBudget(editingId, { amount: Number(editAmount) });
      setEditingId(null);
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to update budget");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this budget?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteBudget(id);
      if (editingId === id) setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to delete budget");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Budgets"
        subtitle="Simple monthly budgets by category."
        right={
          <Field label="Month">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
          </Field>
        }
      />

      {error ? <InlineError message={error} /> : null}

      <Card>
        <div className="text-sm font-semibold text-text-primary">Set budget</div>
        <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3" onSubmit={onCreate}>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Limit amount">
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={busy || !categoryId || toNumber(amount) <= 0}>
              Save
            </Button>
          </div>
        </form>
      </Card>

      {editing ? (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-text-primary">Edit budget</div>
            <Button variant="ghost" type="button" onClick={() => setEditingId(null)}>
              Close
            </Button>
          </div>
          <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3" onSubmit={onSaveEdit}>
            <Field label="Category">
              <Input value={editing.category_name} disabled />
            </Field>
            <Field label="Limit amount">
              <Input inputMode="decimal" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={busy || toNumber(editAmount) <= 0}>
                Update
              </Button>
              <Button type="button" variant="danger" disabled={busy} onClick={() => onDelete(editing.budget_id)}>
                Delete
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-text-primary">This month</div>
          <div className="text-xs text-text-muted">{loading ? "Loading…" : `${items.length} budgets`}</div>
        </div>

        <div className="mt-3 space-y-3">
          {items.map((b) => {
            const limit = toNumber(b.limit_amount);
            const spent = toNumber(b.spent_amount);
            const pct = limit > 0 ? Math.max(0, Math.min(100, (spent / limit) * 100)) : 0;
            return (
              <div key={b.budget_id} className="rounded-xl border border-surface-border bg-surface-raised/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-text-primary">{b.category_name}</div>
                  <div className="text-sm tabular-nums text-text-secondary">
                    {formatAmount(spent)} / {formatAmount(limit)}
                    {b.overspent ? <span className="ml-2 text-xs text-rose-200">overspent</span> : null}
                  </div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-surface-raised">
                  <div className={`h-2 rounded-full ${b.overspent ? "bg-rose-400/40" : "bg-brand/35"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-text-muted">
                  <div>Remaining: {formatAmount(b.remaining_amount)}</div>
                  <Button variant="ghost" type="button" onClick={() => setEditingId(b.budget_id)}>
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
          {!loading && items.length === 0 ? <div className="text-sm text-text-muted">No budgets for this month.</div> : null}
        </div>
      </Card>
    </div>
  );
}
