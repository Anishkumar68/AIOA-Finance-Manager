import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(" ");
}

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
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-faint">Overview</div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      {right && (
        <div className="flex items-center gap-2">{right}</div>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "group relative overflow-hidden rounded-xl border border-surface-border",
        "bg-surface-card/70 backdrop-blur supports-[backdrop-filter]:bg-surface-card/55",
        "shadow-sm shadow-black/10 transition",
        "hover:shadow-black/20",
        "p-4",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-16 h-44 w-44 rounded-full bg-brand-muted/8 blur-3xl" />
      </div>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  right,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("relative flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        {description ? <div className="mt-1 text-xs text-text-muted">{description}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cx("my-4 h-px w-full bg-surface-border", className)} />;
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
      className={cx(
        "w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-sm",
        "text-text-primary placeholder:text-text-faint",
        "outline-none transition",
        "focus:border-brand/50 focus:ring-2 focus:ring-brand/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
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
      className={cx(
        "w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-sm",
        "text-text-primary",
        "outline-none transition appearance-none",
        "focus:border-brand/50 focus:ring-2 focus:ring-brand/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
});

// ── Button ────────────────────────────────────────────────
// FIX: gradient primary → solid brand (gradients are noisy at small sizes)
//      ghost: was text-slate-200 on bg-white/5 (barely visible) → text-text-secondary
//      danger: was text-rose-100 on rose-500/10 (low contrast) → text-danger with proper bg
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-sm shadow-black/20 hover:bg-brand-light active:scale-[0.98]",
  secondary:
    "border border-surface-border bg-surface-raised text-text-primary hover:bg-surface-card active:scale-[0.98]",
  ghost:
    "border border-surface-border bg-transparent text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary",
  danger:
    "border border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/14 hover:border-red-500/30",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-10 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        "transition disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
        buttonSizes[size],
        buttonStyles[variant],
        className,
      )}
    />
  );
}

export function IconButton({
  label,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      className={cx("w-9 px-0", size === "md" ? "w-10" : "w-9", className)}
    />
  );
}

type BadgeVariant = "muted" | "brand" | "success" | "danger";
const badgeStyles: Record<BadgeVariant, string> = {
  muted: "border-surface-border bg-surface-raised text-text-secondary",
  brand: "border-brand/20 bg-brand/10 text-brand-muted",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  danger: "border-red-500/20 bg-red-500/10 text-red-300",
};

export function Badge({
  children,
  variant = "muted",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
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
