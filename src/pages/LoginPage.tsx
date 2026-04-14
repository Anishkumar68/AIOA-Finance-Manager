import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type Mode = "login" | "register";

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const title = useMemo(() => (mode === "login" ? "Login" : "Create account"), [mode]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.isAuthenticated) return;
    const from = (location.state as any)?.from;
    navigate(typeof from === "string" ? from : "/dashboard", { replace: true });
  }, [auth.loading, auth.isAuthenticated, location.state, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await auth.loginWithPassword(email.trim(), password);
      } else {
        await auth.registerAndLogin(name.trim(), email.trim(), password);
      }

      const from = (location.state as any)?.from;
      navigate(typeof from === "string" ? from : "/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-1">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="space-y-2">
          <div className="text-sm font-semibold tracking-wide text-slate-300">AIOA</div>
          <h1 className="text-2xl font-semibold text-slate-50">{title}</h1>
          <p className="text-sm text-slate-300">
            {mode === "login"
              ? "Sign in to track accounts, transactions, budgets, and reports."
              : "Register to start tracking your personal finances."}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-ink-2/40 p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
          <div className="flex gap-2 rounded-xl bg-brand/5 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg px-3 py-2 transition ${
                mode === "login" ? "bg-gradient-to-r from-brand to-brand-light text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg px-3 py-2 transition ${
                mode === "register" ? "bg-gradient-to-r from-brand to-brand-light text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              Sign up
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            {mode === "register" ? (
              <label className="block">
                <div className="mb-1 text-xs font-medium text-slate-300">Name</div>
                <input
                  className="w-full rounded-xl border border-brand-subtle bg-brand/10 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500 backdrop-blur-sm transition focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20"
                  placeholder="Your name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            ) : null}

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">Email</div>
              <input
                className="w-full rounded-xl border border-brand-subtle bg-brand/10 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500 backdrop-blur-sm transition focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-300">Password</div>
              <input
                type="password"
                className="w-full rounded-xl border border-brand-subtle bg-brand/10 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500 backdrop-blur-sm transition focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-light px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:from-brand-light hover:to-brand-muted hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
            </button>

            <div className="text-xs text-slate-400">
              Demo: <span className="text-slate-200">demo@example.com</span> /{" "}
              <span className="text-slate-200">demopassword</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
