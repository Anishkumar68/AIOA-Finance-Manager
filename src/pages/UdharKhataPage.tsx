import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addLoanEntry,
  createContact,
  createLoan,
  deleteLoan,
  deleteLoanEntry,
  getContacts,
  getLoan,
  getLoans,
  Loan,
  Contact
} from "../lib/api";
import { Button, Card, Divider, Field, InlineError, Input, SectionTitle, Select } from "../components/ui";
import { formatAmount, todayIso, toNumber } from "../lib/format";

type Direction = "lent" | "borrowed";

function directionLabel(direction: Direction) {
  return direction === "lent" ? "Lent (Given)" : "Borrowed (Taken)";
}

function disbursementLabel(direction: Direction) {
  return direction === "lent" ? "Given" : "Taken";
}

function repaymentLabel(direction: Direction) {
  return direction === "lent" ? "Recovered" : "Paid back";
}

export default function UdharKhataPage() {
  const [direction, setDirection] = useState<Direction>("lent");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [items, setItems] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Loan | null>(null);
  const selectedFromList = useMemo(() => items.find((x) => x.id === selectedId) ?? null, [items, selectedId]);

  const [useExistingContact, setUseExistingContact] = useState(true);
  const [contactId, setContactId] = useState<number | "">("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [title, setTitle] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [startDate, setStartDate] = useState(todayIso());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [entryKind, setEntryKind] = useState<"repayment" | "disbursement">("repayment");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDate, setEntryDate] = useState(todayIso());
  const [entryNote, setEntryNote] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [contactsData, loansData] = await Promise.all([
        getContacts(false),
        getLoans({ direction, page: 1, limit: 50 })
      ]);
      setContacts(contactsData);
      setItems(loansData.items);

      // keep selection if still present
      if (selectedId && !loansData.items.some((x) => x.id === selectedId)) setSelectedId(null);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load Udhar Khata");
    } finally {
      setLoading(false);
    }
  }

  async function loadSelected(id: number) {
    setError(null);
    try {
      const data = await getLoan(id);
      setSelected(data);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load loan");
      setSelected(null);
    }
  }

  useEffect(() => {
    load();
    setSelected(null);
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    loadSelected(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    if (!useExistingContact) setContactId("");
  }, [useExistingContact]);

  async function onCreateLoan(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let finalContactId: number | null = null;
      if (useExistingContact) {
        finalContactId = typeof contactId === "number" ? contactId : null;
      } else {
        const c = await createContact({ name: contactName.trim(), phone: contactPhone.trim() || undefined });
        finalContactId = c.id;
      }

      if (!finalContactId) throw new Error("Select a contact (or create a new one)");
      if (!amount.trim() || toNumber(amount) <= 0) throw new Error("Enter a valid amount");

      const loan = await createLoan({
        contact_id: finalContactId,
        direction,
        title: title.trim() || undefined,
        currency: currency.trim() || "INR",
        start_date: startDate,
        initial_amount: amount,
        initial_note: note.trim() || undefined
      });

      setTitle("");
      setAmount("");
      setNote("");
      if (!useExistingContact) {
        setContactName("");
        setContactPhone("");
        setUseExistingContact(true);
      }

      await load();
      setSelectedId(loan.id);
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to create loan");
    } finally {
      setBusy(false);
    }
  }

  async function onAddEntry(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      if (!entryAmount.trim() || toNumber(entryAmount) <= 0) throw new Error("Enter a valid amount");
      await addLoanEntry(selectedId, {
        kind: entryKind,
        amount: entryAmount,
        occurred_at: entryDate ? `${entryDate}T00:00:00Z` : undefined,
        note: entryNote.trim() || undefined
      });
      setEntryAmount("");
      setEntryNote("");
      await loadSelected(selectedId);
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to add entry");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteEntry(entryId: number) {
    if (!selectedId) return;
    if (!confirm("Delete this entry?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteLoanEntry(selectedId, entryId);
      await loadSelected(selectedId);
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to delete entry");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteLoan() {
    if (!selectedId) return;
    if (!confirm("Delete this loan and all its entries?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteLoan(selectedId);
      setSelectedId(null);
      setSelected(null);
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to delete loan");
    } finally {
      setBusy(false);
    }
  }

  const totals = useMemo(() => {
    const totalDisbursed = items.reduce((s, x) => s + toNumber(x.total_disbursed), 0);
    const totalRepaid = items.reduce((s, x) => s + toNumber(x.total_repaid), 0);
    const outstanding = items.reduce((s, x) => s + toNumber(x.outstanding), 0);
    return { totalDisbursed, totalRepaid, outstanding };
  }, [items]);

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Udhar Khata"
        subtitle="Track money you lend (given/recovered) and money you borrow (taken/paid back)."
        right={
          <div className="flex items-center gap-2">
            <Button type="button" variant={direction === "lent" ? "primary" : "ghost"} onClick={() => setDirection("lent")}>
              {directionLabel("lent")}
            </Button>
            <Button
              type="button"
              variant={direction === "borrowed" ? "primary" : "ghost"}
              onClick={() => setDirection("borrowed")}
            >
              {directionLabel("borrowed")}
            </Button>
          </div>
        }
      />

      {error ? <InlineError message={error} /> : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">New {direction === "lent" ? "lend" : "borrow"} record</div>
          <div className="text-xs text-slate-400">
            {loading ? "Loading…" : `${items.length} loans • Outstanding ${formatAmount(totals.outstanding, currency)}`}
          </div>
        </div>

        <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6" onSubmit={onCreateLoan}>
          <div className="md:col-span-6 flex flex-wrap items-center gap-3 text-sm text-slate-200">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useExistingContact}
                onChange={(e) => setUseExistingContact(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/30"
              />
              Use existing contact
            </label>
          </div>

          {useExistingContact ? (
            <div className="md:col-span-2">
              <Field label="Contact">
                <Select
                  value={contactId === "" ? "" : String(contactId)}
                  onChange={(e) => setContactId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Select</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` • ${c.phone}` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : (
            <>
              <div className="md:col-span-2">
                <Field label="Contact name">
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Rahul" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Phone (optional)">
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g. 99999…" />
                </Field>
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <Field label="Title (optional)">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bike repair" />
            </Field>
          </div>

          <div className="md:col-span-1">
            <Field label="Currency">
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="INR" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Start date">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label={`${disbursementLabel(direction)} amount`}>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </Field>
          </div>

          <div className="md:col-span-6">
            <Field label="Note (optional)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Cash / UPI / Reason" />
            </Field>
          </div>

          <div className="md:col-span-6">
            <Button
              type="submit"
              disabled={
                busy ||
                loading ||
                (!useExistingContact && !contactName.trim()) ||
                (useExistingContact && !(typeof contactId === "number")) ||
                !amount.trim()
              }
            >
              Create
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Loans</div>
            <div className="text-xs text-slate-400">{loading ? "Loading…" : `${items.length} total`}</div>
          </div>
          <div className="mt-3 space-y-2">
            {items.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                No records yet.
              </div>
            ) : null}
            {items.map((x) => {
              const active = x.id === selectedId;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setSelectedId(x.id)}
                  className={[
                    "w-full rounded-xl border px-3 py-2 text-left transition",
                    active ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">{x.contact_name}</div>
                    <div className="text-xs text-slate-300">{x.status}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-300">{x.title ? x.title : "—"}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="text-slate-400">Outstanding</div>
                    <div className="font-semibold text-slate-100">{formatAmount(x.outstanding, x.currency)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Details</div>
            <div className="text-xs text-slate-400">{selectedFromList ? `#${selectedFromList.id}` : "Select a loan"}</div>
          </div>

          {!selected ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
              Pick a loan from the left to see details and add recoveries/payments.
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-white">{selected.contact_name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{selected.title ? selected.title : "—"}</div>
                </div>
                <Button type="button" variant="danger" disabled={busy} onClick={onDeleteLoan}>
                  Delete loan
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-xs text-slate-400">{disbursementLabel(direction)}</div>
                  <div className="text-sm font-semibold text-white">{formatAmount(selected.total_disbursed, selected.currency)}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-xs text-slate-400">{repaymentLabel(direction)}</div>
                  <div className="text-sm font-semibold text-white">{formatAmount(selected.total_repaid, selected.currency)}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-xs text-slate-400">Outstanding</div>
                  <div className="text-sm font-semibold text-white">{formatAmount(selected.outstanding, selected.currency)}</div>
                </div>
              </div>

              <Divider />

              <div>
                <div className="text-sm font-semibold text-white">Add entry</div>
                <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6" onSubmit={onAddEntry}>
                  <div className="md:col-span-2">
                    <Field label="Type">
                      <Select value={entryKind} onChange={(e) => setEntryKind(e.target.value as any)}>
                        <option value="repayment">{repaymentLabel(direction)}</option>
                        <option value="disbursement">{direction === "lent" ? "Give more" : "Borrow more"}</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Date">
                      <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Amount">
                      <Input inputMode="decimal" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="0.00" />
                    </Field>
                  </div>
                  <div className="md:col-span-6">
                    <Field label="Note (optional)">
                      <Input value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="e.g. UPI / Cash" />
                    </Field>
                  </div>
                  <div className="md:col-span-6">
                    <Button type="submit" disabled={busy || !entryAmount.trim()}>
                      Add
                    </Button>
                  </div>
                </form>
              </div>

              <Divider />

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">Timeline</div>
                  <div className="text-xs text-slate-400">{selected.entries?.length ? `${selected.entries.length} entries` : "—"}</div>
                </div>

                <div className="mt-3 space-y-2">
                  {(selected.entries ?? []).map((e) => (
                    <div key={e.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {e.kind === "disbursement" ? disbursementLabel(direction) : repaymentLabel(direction)}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {new Date(e.occurred_at).toLocaleString()} {e.note ? `• ${e.note}` : ""} • #{e.id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-slate-100">{formatAmount(e.amount, selected.currency)}</div>
                          <Button type="button" variant="ghost" disabled={busy} onClick={() => onDeleteEntry(e.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
