import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, Field, InlineError, Input, SectionTitle, Select } from "../components/ui";
import { archiveAccount, createAccount, getAccounts, updateAccount } from "../lib/api";
import { formatAmount } from "../lib/format";

const ACCOUNT_TYPES = ["cash", "bank", "wallet", "credit_card"];

export default function AccountsPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [currency, setCurrency] = useState("INR");
  const [opening, setOpening] = useState("0");
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const editing = useMemo(() => items.find((x) => x.id === editingId) ?? null, [items, editingId]);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editActive, setEditActive] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAccounts(includeInactive);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  useEffect(() => {
    if (!editing) return;
    setEditName(editing.name ?? "");
    setEditType(editing.type ?? "cash");
    setEditCurrency(editing.currency ?? "INR");
    setEditActive(!!editing.is_active);
  }, [editing]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createAccount({
        name: name.trim(),
        type,
        currency: currency.trim() || "INR",
        opening_balance: Number(opening || 0)
      });
      setName("");
      setOpening("0");
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to create account");
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
      await updateAccount(editingId, {
        name: editName.trim(),
        type: editType,
        currency: editCurrency.trim() || "INR",
        is_active: editActive
      });
      setEditingId(null);
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to update account");
    } finally {
      setBusy(false);
    }
  }

  async function onArchive(id: number) {
    if (!confirm("Archive this account?")) return;
    setBusy(true);
    setError(null);
    try {
      await archiveAccount(id);
      if (editingId === id) setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to archive account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Accounts"
        subtitle="Create, edit, and archive accounts."
        right={
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 rounded border-surface-border bg-surface-raised text-brand focus:ring-2 focus:ring-brand/20"
            />
            Show archived
          </label>
        }
      />

      {error ? <InlineError message={error} /> : null}

      <Card>
        <div className="text-sm font-semibold text-text-primary">New account</div>
        <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={onCreate}>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wallet" />
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Currency">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="INR" />
          </Field>
          <Field label="Opening balance">
            <Input inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value)} />
          </Field>
          <div className="md:col-span-4">
            <Button type="submit" disabled={busy || !name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </Card>

      {editing ? (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-text-primary">Edit account</div>
            <Button variant="ghost" type="button" onClick={() => setEditingId(null)}>
              Close
            </Button>
          </div>
          <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={onSaveEdit}>
            <Field label="Name">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </Field>
            <Field label="Type">
              <Select value={editType} onChange={(e) => setEditType(e.target.value)}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Currency">
              <Input value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} />
            </Field>
            <Field label="Active">
              <Select value={editActive ? "true" : "false"} onChange={(e) => setEditActive(e.target.value === "true")}>
                <option value="true">Active</option>
                <option value="false">Archived</option>
              </Select>
            </Field>
            <div className="md:col-span-4 flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || !editName.trim()}>
                Save changes
              </Button>
              <Button type="button" variant="danger" disabled={busy} onClick={() => onArchive(editing.id)}>
                Archive
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-text-primary">Accounts</div>
          <div className="text-xs text-text-muted">{loading ? "Loading…" : `${items.length} total`}</div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
              <tr className="border-b border-surface-border">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Currency</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Balance</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {items.map((a) => (
                <tr key={a.id} className="border-b border-surface-border/70 last:border-b-0 hover:bg-surface-raised/30">
                  <td className="py-2 pr-3 text-text-primary">{a.name}</td>
                  <td className="py-2 pr-3">{a.type}</td>
                  <td className="py-2 pr-3">{a.currency}</td>
                  <td className="py-2 pr-3">{a.is_active ? "active" : "archived"}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{formatAmount(a.current_balance, a.currency)}</td>
                  <td className="py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="ghost" type="button" onClick={() => setEditingId(a.id)}>
                        Edit
                      </Button>
                      <Button variant="danger" type="button" disabled={busy} onClick={() => onArchive(a.id)}>
                        Archive
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-text-muted" colSpan={6}>
                    No accounts yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
