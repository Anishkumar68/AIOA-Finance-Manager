import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, InlineError, Input, SectionTitle } from "../components/ui";
import { forgotPassword } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setDebugToken(null);
    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message || "If an account exists for this email, a reset token has been generated.");
      if (res.reset_token) setDebugToken(String(res.reset_token));
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Failed to request password reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-6 py-10">
      <SectionTitle title="Forgot password" subtitle="Request a reset token for your account." />

      <Card className="p-5">
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <div className="mb-1.5 text-xs font-medium text-text-secondary">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </label>

          {error ? <InlineError message={error} /> : null}
          {message ? <div className="text-sm text-text-muted">{message}</div> : null}
          {debugToken ? (
            <div className="rounded-lg border border-surface-border bg-surface-raised p-3 text-xs text-text-secondary">
              <div className="font-semibold text-text-primary">Debug token</div>
              <div className="mt-1 break-all">{debugToken}</div>
              <div className="mt-2">
                Go to <Link className="text-brand-muted underline" to={`/reset-password?token=${encodeURIComponent(debugToken)}`}>Reset password</Link>
              </div>
            </div>
          ) : null}

          <Button type="submit" disabled={busy || !email.trim()} className="w-full justify-center">
            {busy ? "Working…" : "Request reset"}
          </Button>

          <div className="text-xs text-text-muted">
            <Link to="/login" className="text-text-secondary underline">
              Back to login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

