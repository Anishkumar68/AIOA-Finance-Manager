import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Badge, Button, Card, CardDivider, InlineError, Input } from "../components/ui";
import { Lock, Sparkles } from "lucide-react";

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
    <div className="relative min-h-screen bg-surface-base">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/14 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -right-44 h-[560px] w-[560px] rounded-full bg-brand-muted/8 blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-muted text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-text-faint">AIOA Finance</div>
              <div className="text-[13px] font-semibold text-text-primary">Personal dashboard</div>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
          <p className="text-sm text-text-muted">
            {mode === "login"
              ? "Sign in to track accounts, transactions, budgets, and reports."
              : "Create an account to start tracking your personal finances."}
          </p>
        </div>

        <div className="mt-8">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Lock size={16} className="text-brand-muted" /> Secure access
              </div>
              <Badge variant="muted">JWT</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-surface-border bg-surface-raised/40 p-1">
              <Button
                type="button"
                variant={mode === "login" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMode("login")}
                className="w-full justify-center"
              >
                Login
              </Button>
              <Button
                type="button"
                variant={mode === "register" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMode("register")}
                className="w-full justify-center"
              >
                Sign up
              </Button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              {mode === "register" ? (
                <label className="block">
                  <div className="mb-1.5 text-xs font-medium text-text-secondary">Name</div>
                  <Input
                    placeholder="Your name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              ) : null}

              <label className="block">
                <div className="mb-1.5 text-xs font-medium text-text-secondary">Email</div>
                <Input
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="block">
                <div className="mb-1.5 text-xs font-medium text-text-secondary">Password</div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {error ? <InlineError message={error} /> : null}

              <Button type="submit" disabled={busy} className="w-full justify-center">
                {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
              </Button>

              <CardDivider className="my-3" />

              <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                <Link to="/forgot-password" className="text-text-secondary underline">
                  Forgot password?
                </Link>
                <div>
                  Demo: <span className="text-text-secondary">demo@example.com</span> /{" "}
                  <span className="text-text-secondary">demopassword</span>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
