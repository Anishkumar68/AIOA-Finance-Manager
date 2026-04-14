import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

// ── SectionTitle ──────────────────────────────────────────
export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      {right && (
        <div className="flex items-center gap-2">{right}</div>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────
// FIX: was bg-black/10 (nearly invisible on dark bg) → now surface.card
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "rounded-lg border border-surface-border bg-surface-card p-4",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────
// FIX: was text-white on bg-brand/10 (indigo tint → white text invisible)
//      → now bg-surface-raised with explicit text-text-primary
//      FIX: placeholder was text-slate-500 (too light on dark) → text-text-faint
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      {...props}
      className={[
        "w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm",
        "text-text-primary placeholder:text-text-faint",
        "outline-none transition",
        "focus:border-brand/50 focus:ring-2 focus:ring-brand/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className ?? "",
      ].join(" ")}
    />
  );
});

// ── Select ────────────────────────────────────────────────
// FIX: same contrast issues as Input + select options need explicit bg
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      {...props}
      className={[
        "w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm",
        "text-text-primary",
        "outline-none transition appearance-none",
        "focus:border-brand/50 focus:ring-2 focus:ring-brand/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className ?? "",
      ].join(" ")}
    />
  );
});

// ── Button ────────────────────────────────────────────────
// FIX: gradient primary → solid brand (gradients are noisy at small sizes)
//      ghost: was text-slate-200 on bg-white/5 (barely visible) → text-text-secondary
//      danger: was text-rose-100 on rose-500/10 (low contrast) → text-danger with proper bg
type ButtonVariant = "primary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-light active:scale-[0.98]",
  ghost:
    "border border-surface-border bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary",
  danger:
    "border border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/14 hover:border-red-500/30",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
        "transition disabled:cursor-not-allowed disabled:opacity-50",
        buttonStyles[variant],
        className ?? "",
      ].join(" ")}
    />
  );
}

// ── Field ─────────────────────────────────────────────────
// FIX: label was text-slate-300 (clashes with custom palette) → text-text-secondary
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-text-secondary">
        {label}
      </div>
      {children}
    </label>
  );
}

// ── InlineError ───────────────────────────────────────────
// FIX: was text-rose-100 (invisible on light-ish dark surfaces) → text-red-400
//      Added icon for better UX affordance
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-sm text-red-400">
      <AlertCircle size={14} className="shrink-0" />
      {message}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────
// FIX: was bg-white/10 (too bright on dark) → surface-border token
export function Divider() {
  return <div className="my-4 h-px w-full bg-surface-border" />;
}