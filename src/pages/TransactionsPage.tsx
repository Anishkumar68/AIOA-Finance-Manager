import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Field, InlineError, Input, SectionTitle, Select } from "../components/ui";
import {
  deleteTransaction,
  exportTransactionsUrl,
  getAccounts,
  getCategories,
  getTags,
  getTransactions,
  importTransactionsCsv,
  importTransactionsTemplateUrl,
  TransactionImportResponse
} from "../lib/api";
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
  const [tagId, setTagId] = useState<string>("");
  const [allTags, setAllTags] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<TransactionImportResponse | null>(null);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, c, t] = await Promise.all([getAccounts(true), getCategories(undefined, true), getTags()]);
        if (cancelled) return;
        setAccounts(a);
        setCategories(c);
        setAllTags(t.items);
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
        tag_id: tagId ? Number(tagId) : undefined,
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
  }, [fromDate, toDate, accountId, categoryId, type, search, tagId]);

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

  function handleExport() {
    const url = exportTransactionsUrl({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      account_id: accountId ? Number(accountId) : undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      type: type || undefined,
      search: search || undefined
    });

    // Get auth token
    const tokens = JSON.parse(localStorage.getItem("auth_tokens") || "{}");
    const headers: HeadersInit = {};
    if (tokens.accessToken) {
      headers["Authorization"] = `Bearer ${tokens.accessToken}`;
    }

    fetch(url, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Export failed");
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "transactions.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        setError("Failed to export transactions");
        console.error("Export error:", err);
      });
  }

  function handleImportClick() {
    setImportResult(null);
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setError(null);
    try {
      const res = await importTransactionsCsv(file, { mode: "partial" });
      setImportResult(res);
      if (res.imported > 0) await load(1);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to import transactions");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Transactions"
        subtitle="Filter, search, add, edit, and delete."
        right={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) handleImportFile(f);
              }}
            />
            <Button variant="ghost" type="button" onClick={() => window.open(importTransactionsTemplateUrl(), "_blank")}>
              Template
            </Button>
            <Button variant="ghost" type="button" onClick={handleImportClick} disabled={importing}>
              {importing ? "Importing…" : "Import CSV"}
            </Button>
            <Button variant="ghost" type="button" onClick={handleExport}>
              Export CSV
            </Button>
            <Link to="/transactions/new">
              <Button type="button">Add transaction</Button>
            </Link>
          </div>
        }
      />

      {error ? <InlineError message={error} /> : null}

      {importResult ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-text-primary">Import result</div>
            <div className="text-xs text-text-muted">
              {importResult.imported} imported · {importResult.failed} failed · {importResult.total_rows} rows
            </div>
          </div>
          {importResult.errors?.length ? (
            <div className="mt-3 text-sm text-text-secondary">
              <details>
                <summary className="cursor-pointer text-text-muted">View errors ({importResult.errors.length})</summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
                      <tr className="border-b border-surface-border">
                        <th className="py-2 pr-3 font-medium">Row</th>
                        <th className="py-2 pr-3 font-medium">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.slice(0, 25).map((er, idx) => (
                        <tr key={idx} className="border-b border-surface-border/70 last:border-b-0">
                          <td className="py-2 pr-3 tabular-nums">{er.row_number}</td>
                          <td className="py-2 pr-3">{er.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importResult.errors.length > 25 ? (
                    <div className="mt-2 text-xs text-text-muted">Showing first 25 errors.</div>
                  ) : null}
                </div>
              </details>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <div className="text-sm font-semibold text-text-primary">Filters</div>
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
          <Field label="Tag">
            <Select value={tagId} onChange={(e) => setTagId(e.target.value)}>
              <option value="">All</option>
              {allTags.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  #{t.name}
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
          <div className="text-sm font-semibold text-text-primary">Results</div>
          <div className="text-xs text-text-muted">{loading ? "Loading…" : `${total} total`}</div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
              <tr className="border-b border-surface-border">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Account</th>
                <th className="py-2 pr-3 font-medium">Category / Transfer</th>
                <th className="py-2 pr-3 font-medium">Note / Tags</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
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
                  <tr key={t.id} className="border-b border-surface-border/70 last:border-b-0 hover:bg-surface-raised/30">
                    <td className="py-2 pr-3 text-text-muted">{t.date}</td>
                    <td className="py-2 pr-3">{t.type}</td>
                    <td className="py-2 pr-3 text-text-primary">{acc?.name ?? `#${t.account_id}`}</td>
                    <td className="py-2 pr-3">{detail}</td>
                    <td className="py-2 pr-3">
                      <div>{t.note ?? "—"}</div>
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.tags.map((tag: any) => (
                            <span
                              key={tag.id}
                              className={
                                tag.color
                                  ? "inline-flex items-center px-1.5 py-0.5 rounded text-[10px]"
                                  : "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border border-brand/20 bg-brand/10 text-brand-muted"
                              }
                              style={
                                tag.color
                                  ? { backgroundColor: `${tag.color}33`, color: tag.color }
                                  : undefined
                              }
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-text-primary">{formatAmount(t.amount, currency)}</td>
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
                  <td className="py-6 text-sm text-text-muted" colSpan={7}>
                    No matching transactions.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-text-muted">
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
