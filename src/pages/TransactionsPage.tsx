import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Field, InlineError, Input, SectionTitle, Select } from "../components/ui";
import { deleteTransaction, getAccounts, getCategories, getTransactions } from "../lib/api";
import { formatAmount } from "../lib/format";

export default function TransactionsPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, c] = await Promise.all([getAccounts(true), getCategories(undefined, true)]);
        if (cancelled) return;
        setAccounts(a);
        setCategories(c);
      } catch {
        // non-fatal; page still works with ids
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function load(nextPage: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await getTransactions({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        account_id: accountId ? Number(accountId) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        type: type || undefined,
        search: search || undefined,
        page: nextPage,
        limit: 20
      });
      setItems(res.items);
      setPage(res.page);
      setPages(res.pages);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, accountId, categoryId, type, search]);

  async function onDelete(id: number) {
    if (!confirm("Delete this transaction?")) return;
    setError(null);
    try {
      await deleteTransaction(id);
      await load(page);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to delete transaction");
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Transactions"
        subtitle="Filter, search, add, edit, and delete."
        right={
          <Link to="/transactions/new">
            <Button type="button">Add transaction</Button>
          </Link>
        }
      />

      {error ? <InlineError message={error} /> : null}

      <Card>
        <div className="text-sm font-semibold text-white">Filters</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6">
          <Field label="From">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              <option value="income">income</option>
              <option value="expense">expense</option>
              <option value="transfer">transfer</option>
            </Select>
          </Field>
          <Field label="Account">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">All</option>
              {accounts.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}
                  {!a.is_active ? " (archived)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} ({c.type})
                  {!c.is_active ? " (inactive)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Search note">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. grocery" />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">Results</div>
          <div className="text-xs text-slate-400">{loading ? "Loading…" : `${total} total`}</div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="border-b border-white/10">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Account</th>
                <th className="py-2 pr-3 font-medium">Category / Transfer</th>
                <th className="py-2 pr-3 font-medium">Note</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {items.map((t) => {
                const acc = accountById.get(t.account_id);
                const cat = t.category_id ? categoryById.get(t.category_id) : null;
                const transferAcc = t.transfer_account_id ? accountById.get(t.transfer_account_id) : null;
                const currency = acc?.currency;
                const detail =
                  t.type === "transfer"
                    ? `→ ${transferAcc?.name ?? `#${t.transfer_account_id}`}`
                    : cat?.name ?? (t.category_id ? `#${t.category_id}` : "—");
                return (
                  <tr key={t.id} className="border-b border-white/5 last:border-b-0">
                    <td className="py-2 pr-3">{t.date}</td>
                    <td className="py-2 pr-3">{t.type}</td>
                    <td className="py-2 pr-3">{acc?.name ?? `#${t.account_id}`}</td>
                    <td className="py-2 pr-3">{detail}</td>
                    <td className="py-2 pr-3">{t.note ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums">{formatAmount(t.amount, currency)}</td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link to={`/transactions/${t.id}/edit`}>
                          <Button variant="ghost" type="button">
                            Edit
                          </Button>
                        </Link>
                        <Button variant="danger" type="button" onClick={() => onDelete(t.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && items.length === 0 ? (
                <tr>
                  <td className="py-4 text-sm text-slate-400" colSpan={7}>
                    No matching transactions.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Page {page} / {pages}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" type="button" disabled={loading || page <= 1} onClick={() => load(page - 1)}>
              Prev
            </Button>
            <Button variant="ghost" type="button" disabled={loading || page >= pages} onClick={() => load(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
