import { forwardRef } from "react";

export function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-black/10 p-4">{children}</div>;
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={[
        "w-full rounded-xl border border-brand-subtle bg-brand/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-sm transition focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20",
        props.className ?? ""
      ].join(" ")}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(props, ref) {
  return (
    <select
      ref={ref}
      {...props}
      className={[
        "w-full rounded-xl border border-brand-subtle bg-brand/10 px-3 py-2 text-sm text-white outline-none backdrop-blur-sm transition focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20",
        props.className ?? ""
      ].join(" ")}
    />
  );
});

export function Button({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-brand to-brand-light text-white hover:from-brand-light hover:to-brand-muted shadow-md hover:shadow-lg active:scale-[0.98]"
      : variant === "danger"
        ? "border border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";

  return <button {...props} className={[base, styles, props.className ?? ""].join(" ")} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-300">{label}</div>
      {children}
    </label>
  );
}

export function InlineError({ message }: { message: string }) {
  return <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{message}</div>;
}

export function Divider() {
  return <div className="my-4 h-px w-full bg-white/10" />;
}

