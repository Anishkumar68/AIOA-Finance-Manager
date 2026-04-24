import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, Field, InlineError, Input, SectionTitle } from "../components/ui";
import { addGoalContribution, createGoal, deleteGoal, getGoals, updateGoal } from "../lib/api";
import { formatAmount, todayIso, toNumber } from "../lib/format";

export default function GoalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [targetAmount, setTargetAmount] = useState("0");
  const [startDate, setStartDate] = useState(todayIso());
  const [targetDate, setTargetDate] = useState("");
  const [note, setNote] = useState("");

  // Contribution (per goal)
  const [contribGoalId, setContribGoalId] = useState<number | null>(null);
  const [contribAmount, setContribAmount] = useState("0");
  const [contribDate, setContribDate] = useState(todayIso());
  const [contribNote, setContribNote] = useState("");

  const activeCount = useMemo(() => items.filter((g) => g.is_active).length, [items]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getGoals(includeInactive);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createGoal({
        name,
        currency: currency || "INR",
        target_amount: Number(targetAmount),
        start_date: startDate,
        target_date: targetDate || undefined,
        note: note || undefined,
      });
      setName("");
      setTargetAmount("0");
      setTargetDate("");
      setNote("");
      await load();
    } catch (e2: any) {
      setError(e2?.message ? String(e2.message) : "Failed to create goal");
    } finally {
      setBusy(false);
    }
  }

  async function onArchive(goalId: number, nextActive: boolean) {
    setBusy(true);
    setError(null);
    try {
      await updateGoal(goalId, { is_active: nextActive });
      if (!nextActive && contribGoalId === goalId) setContribGoalId(null);
      await load();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to update goal");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(goalId: number) {
    if (!confirm("Delete this goal (and all contributions)?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteGoal(goalId);
      if (contribGoalId === goalId) setContribGoalId(null);
      await load();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to delete goal");
    } finally {
      setBusy(false);
    }
  }

  async function onAddContribution(e: FormEvent) {
    e.preventDefault();
    if (!contribGoalId) return;
    setBusy(true);
    setError(null);
    try {
      await addGoalContribution(contribGoalId, {
        amount: Number(contribAmount),
        date: contribDate || undefined,
        note: contribNote || undefined,
      });
      setContribAmount("0");
      setContribNote("");
      await load();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to add contribution");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Goals"
        subtitle="Track progress towards savings targets."
        right={
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Show archived
          </label>
        }
      />

      {error ? <InlineError message={error} /> : null}

      <Card>
        <div className="text-sm font-semibold text-white">Create goal</div>
        <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6" onSubmit={onCreate}>
          <div className="md:col-span-2">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vacation" />
            </Field>
          </div>
          <Field label="Currency">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))} placeholder="INR" />
          </Field>
          <Field label="Target amount">
            <Input inputMode="decimal" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
          </Field>
          <Field label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Target date (optional)">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
          <div className="md:col-span-6">
            <Field label="Note (optional)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Save for flights + hotel" />
            </Field>
          </div>
          <div className="md:col-span-6 flex items-end">
            <Button type="submit" disabled={busy || !name.trim() || toNumber(targetAmount) <= 0 || !startDate}>
              Create
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">Your goals</div>
          <div className="text-xs text-slate-400">{loading ? "Loading…" : `${activeCount} active`}</div>
        </div>

        <div className="mt-3 space-y-3">
          {items.map((g) => {
            const pct = Number(g.progress_pct ?? 0);
            const isOpen = contribGoalId === g.id;
            const saved = formatAmount(g.saved_amount, g.currency);
            const target = formatAmount(g.target_amount, g.currency);
            const remaining = formatAmount(g.remaining_amount, g.currency);
            return (
              <div key={g.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-slate-100">{g.name}</div>
                      {g.is_completed ? (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">completed</span>
                      ) : null}
                      {!g.is_active ? (
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">archived</span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      Saved {saved} / {target} • Remaining {remaining}
                      {g.target_date ? <span> • Target date {g.target_date}</span> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" type="button" onClick={() => setContribGoalId(isOpen ? null : g.id)} disabled={busy || !g.is_active}>
                      {isOpen ? "Close" : "Add contribution"}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => onArchive(g.id, !g.is_active)}
                      disabled={busy}
                      className="whitespace-nowrap"
                    >
                      {g.is_active ? "Archive" : "Unarchive"}
                    </Button>
                    <Button variant="danger" type="button" onClick={() => onDelete(g.id)} disabled={busy}>
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-white/20" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                </div>

                {isOpen ? (
                  <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={onAddContribution}>
                    <Field label="Amount">
                      <Input inputMode="decimal" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} />
                    </Field>
                    <Field label="Date">
                      <Input type="date" value={contribDate} onChange={(e) => setContribDate(e.target.value)} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Note (optional)">
                        <Input value={contribNote} onChange={(e) => setContribNote(e.target.value)} />
                      </Field>
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" disabled={busy || toNumber(contribAmount) <= 0 || !contribDate}>
                        Add
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            );
          })}

          {!loading && items.length === 0 ? <div className="text-sm text-slate-400">No goals yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}

