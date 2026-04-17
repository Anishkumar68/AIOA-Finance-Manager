import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, Field, InlineError, Input, SectionTitle, Select } from "../components/ui";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../lib/api";

export default function CategoriesPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const editing = useMemo(() => items.find((x) => x.id === editingId) ?? null, [items, editingId]);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("expense");
  const [editActive, setEditActive] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories(filterType || undefined, includeInactive);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive, filterType]);

  useEffect(() => {
    if (!editing) return;
    setEditName(editing.name ?? "");
    setEditType(editing.type ?? "expense");
    setEditActive(!!editing.is_active);
  }, [editing]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createCategory({ name: name.trim(), type });
      setName("");
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to create category");
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
      await updateCategory(editingId, { name: editName.trim(), type: editType, is_active: editActive });
      setEditingId(null);
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to update category");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this category? This only works if it is unused.")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(id);
      if (editingId === id) setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to delete category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Categories"
        subtitle="Income and expense categories."
        right={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="h-4 w-4 rounded border-surface-border bg-surface-raised text-brand focus:ring-2 focus:ring-brand/20"
              />
              Show inactive
            </label>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-40">
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </div>
        }
      />

      {error ? <InlineError message={error} /> : null}

      <Card>
        <div className="text-sm font-semibold text-text-primary">New category</div>
        <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3" onSubmit={onCreate}>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Food" />
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="income">income</option>
              <option value="expense">expense</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={busy || !name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </Card>

      {editing ? (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-text-primary">Edit category</div>
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
                <option value="income">income</option>
                <option value="expense">expense</option>
              </Select>
            </Field>
            <Field label="Active">
              <Select value={editActive ? "true" : "false"} onChange={(e) => setEditActive(e.target.value === "true")}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={busy || !editName.trim()}>
                Save
              </Button>
              <Button type="button" variant="danger" disabled={busy} onClick={() => onDelete(editing.id)}>
                Delete
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-text-primary">Categories</div>
          <div className="text-xs text-text-muted">{loading ? "Loading…" : `${items.length} total`}</div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
              <tr className="border-b border-surface-border">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {items.map((c) => (
                <tr key={c.id} className="border-b border-surface-border/70 last:border-b-0 hover:bg-surface-raised/30">
                  <td className="py-2 pr-3 text-text-primary">{c.name}</td>
                  <td className="py-2 pr-3">{c.type}</td>
                  <td className="py-2 pr-3">{c.is_active ? "active" : "inactive"}</td>
                  <td className="py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="ghost" type="button" onClick={() => setEditingId(c.id)}>
                        Edit
                      </Button>
                      <Button variant="danger" type="button" disabled={busy} onClick={() => onDelete(c.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-text-muted" colSpan={4}>
                    No categories yet.
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
