import { useEffect, useMemo, useState } from "react";
import { Button, Card, Field, InlineError, Input, SectionTitle, Select } from "../components/ui";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  getAccounts,
  getCategories,
  getRecurringTransactions,
  RecurringTransaction
} from "../lib/api";
import { formatAmount } from "../lib/format";

export default function RecurringTransactionsPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formType, setFormType] = useState<"income" | "expense" | "transfer">("expense");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formTransferAccountId, setFormTransferAccountId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formFrequency, setFormFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [formInterval, setFormInterval] = useState("1");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formReference, setFormReference] = useState("");

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, c, r] = await Promise.all([
          getAccounts(true),
          getCategories(undefined, true),
          getRecurringTransactions()
        ]);
        if (cancelled) return;
        setAccounts(a);
        setCategories(c);
        setItems(r.items);
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formAccountId || !formAmount || !formStartDate) {
      setError("Please fill in all required fields");
      return;
    }

    if (formType === "transfer" && !formTransferAccountId) {
      setError("Please select a transfer account");
      return;
    }

    try {
      await createRecurringTransaction({
        account_id: Number(formAccountId),
        category_id: formCategoryId ? Number(formCategoryId) : undefined,
        type: formType,
        amount: Number(formAmount),
        frequency: formFrequency,
        interval: Number(formInterval),
        start_date: formStartDate,
        end_date: formEndDate || undefined,
        note: formNote || undefined,
        reference: formReference || undefined,
        transfer_account_id: formTransferAccountId ? Number(formTransferAccountId) : undefined
      });

      // Reload
      const r = await getRecurringTransactions();
      setItems(r.items);
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Failed to create recurring transaction");
    }
  }

  function resetForm() {
    setFormType("expense");
    setFormAccountId("");
    setFormCategoryId("");
    setFormTransferAccountId("");
    setFormAmount("");
    setFormFrequency("monthly");
    setFormInterval("1");
    setFormStartDate("");
    setFormEndDate("");
    setFormNote("");
    setFormReference("");
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this recurring transaction?")) return;
    setError(null);
    try {
      await deleteRecurringTransaction(id);
      const r = await getRecurringTransactions();
      setItems(r.items);
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Failed to delete recurring transaction");
    }
  }

  const frequencyLabel = (freq: string, interval: number) => {
    if (interval === 1) return freq;
    return `Every ${interval} ${freq}s`;
  };

  if (loading) {
    return <div className="text-text-muted">Loading...</div>;
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Recurring Transactions"
        subtitle="Automate regular income, expenses, and transfers."
        right={
          <Button type="button" onClick={() => { setShowForm(true); resetForm(); }}>
            Add recurring
          </Button>
        }
      />

      {error ? <InlineError message={error} /> : null}

      {showForm && (
        <Card>
          <div className="text-sm font-semibold text-white mb-3">New Recurring Transaction</div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Type">
                <Select value={formType} onChange={(e) => setFormType(e.target.value as any)}>
                  <option value="income">income</option>
                  <option value="expense">expense</option>
                  <option value="transfer">transfer</option>
                </Select>
              </Field>

              <Field label="Account">
                <Select value={formAccountId} onChange={(e) => setFormAccountId(e.target.value)}>
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </Field>

              {formType !== "transfer" && (
                <Field label="Category">
                  <Select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}>
                    <option value="">Select category</option>
                    {categories
                      .filter((c) => c.type === formType)
                      .map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                  </Select>
                </Field>
              )}

              {formType === "transfer" && (
                <Field label="Transfer to">
                  <Select value={formTransferAccountId} onChange={(e) => setFormTransferAccountId(e.target.value)}>
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              <Field label="Amount">
                <Input
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Frequency">
                <Select value={formFrequency} onChange={(e) => setFormFrequency(e.target.value as any)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </Field>

              <Field label="Every X">
                <Input
                  type="number"
                  min="1"
                  value={formInterval}
                  onChange={(e) => setFormInterval(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Start Date">
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
              </Field>

              <Field label="End Date (optional)">
                <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
              </Field>

              <Field label="Note (optional)">
                <Input value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="e.g. Monthly rent" />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Active Recurring Transactions</div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-sm text-text-muted py-4 text-center">
              No recurring transactions. Add one to get started.
            </div>
          ) : (
            items.map((item) => {
              const account = accountById.get(item.account_id);
              const category = item.category_id ? categoryById.get(item.category_id) : null;
              const transferAccount = item.transfer_account_id ? accountById.get(item.transfer_account_id) : null;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface-raised/40"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {frequencyLabel(item.frequency, item.interval)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          item.type === "income"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : item.type === "expense"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {account?.name} → {category?.name ?? transferAccount?.name ?? "—"}
                      {item.note ? ` · ${item.note}` : ""}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Next: {item.next_occurrence}
                      {item.end_date ? ` · Until: ${item.end_date}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-white tabular-nums">
                      {formatAmount(item.amount, account?.currency)}
                    </div>
                    <Button variant="danger" type="button" onClick={() => onDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
