import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Field, InlineError, Input, SectionTitle, Select } from "../components/ui";
import { createTransaction, getAccounts, getCategories, getTransaction, updateTransaction } from "../lib/api";
import { todayIso } from "../lib/format";

export default function TransactionFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const params = useParams();
  const id = mode === "edit" ? Number(params.id) : null;

  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [amount, setAmount] = useState("0");
  const [accountId, setAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [transferAccountId, setTransferAccountId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, c] = await Promise.all([getAccounts(true), getCategories(undefined, true)]);
        if (cancelled) return;
        setAccounts(a);
        setCategories(c);
        if (!accountId && a.length) setAccountId(String(a.find((x) => x.is_active)?.id ?? a[0].id));
      } catch (e: any) {
        if (!cancelled) setError(e?.message ? String(e.message) : "Failed to load form data");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const t = await getTransaction(id);
        if (cancelled) return;
        setType(t.type as any);
        setAmount(String(t.amount ?? "0"));
        setAccountId(String(t.account_id));
        setCategoryId(t.category_id ? String(t.category_id) : "");
        setDate(String(t.date ?? todayIso()));
        setNote(t.note ?? "");
        setReference(t.reference ?? "");
        setTransferAccountId(t.transfer_account_id ? String(t.transfer_account_id) : "");
      } catch (e: any) {
        if (!cancelled) setError(e?.message ? String(e.message) : "Failed to load transaction");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.is_active), [accounts]);
  const categoryOptions = useMemo(() => {
    return categories.filter((c) => c.type === type && c.is_active);
  }, [categories, type]);

  const canSubmit = useMemo(() => {
    if (!accountId) return false;
    if (!date) return false;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return false;
    if (type === "transfer") {
      if (!transferAccountId) return false;
      if (transferAccountId === accountId) return false;
      return true;
    }
    return !!categoryId;
  }, [accountId, amount, categoryId, date, transferAccountId, type]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: any = {
        type,
        amount: Number(amount),
        account_id: Number(accountId),
        date,
        note: note.trim() || null,
        reference: reference.trim() || null,
        category_id: type === "transfer" ? null : Number(categoryId),
        transfer_account_id: type === "transfer" ? Number(transferAccountId) : null
      };

      if (mode === "create") {
        await createTransaction(payload);
      } else if (id) {
        await updateTransaction(id, payload);
      }
      navigate("/transactions", { replace: true });
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to save transaction");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title={mode === "create" ? "Add transaction" : "Edit transaction"}
        subtitle="Income, expense, or transfer."
        right={
          <Link to="/transactions">
            <Button variant="ghost" type="button">
              Back
            </Button>
          </Link>
        }
      />

      {error ? <InlineError message={error} /> : null}

      <Card>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as any)} disabled={loading || busy}>
              <option value="income">income</option>
              <option value="expense">expense</option>
              <option value="transfer">transfer</option>
            </Select>
          </Field>

          <Field label="Amount">
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={loading || busy} />
          </Field>

          <Field label={type === "transfer" ? "From account" : "Account"}>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={loading || busy}>
              <option value="">Select…</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </Select>
          </Field>

          {type === "transfer" ? (
            <Field label="To account">
              <Select value={transferAccountId} onChange={(e) => setTransferAccountId(e.target.value)} disabled={loading || busy}>
                <option value="">Select…</option>
                {activeAccounts
                  .filter((a) => String(a.id) !== accountId)
                  .map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
              </Select>
            </Field>
          ) : (
            <Field label="Category">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={loading || busy}>
                <option value="">Select…</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={loading || busy} />
          </Field>

          <Field label="Reference (optional)">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} disabled={loading || busy} placeholder="e.g. invoice id" />
          </Field>

          <div className="md:col-span-2">
            <Field label="Note (optional)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} disabled={loading || busy} placeholder="e.g. Grocery shopping" />
            </Field>
          </div>

          <div className="md:col-span-2 my-1 h-px w-full bg-white/10" />

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button type="submit" disabled={loading || busy || !canSubmit}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" disabled={loading || busy} onClick={() => navigate("/transactions")}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
