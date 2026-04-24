import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, InlineError, Input, SectionTitle } from "../components/ui";
import { resetPassword } from "../lib/api";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPasswordPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => query.get("token") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await resetPassword({ token: token.trim(), new_password: newPassword });
      setMessage(res.message || "Password reset successfully.");
      setTimeout(() => navigate("/login"), 600);
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-6 py-10">
      <SectionTitle title="Reset password" subtitle="Use your reset token to set a new password." />

      <Card className="p-5">
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <div className="mb-1.5 text-xs font-medium text-text-secondary">Reset token</div>
            <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="paste token" />
          </label>

          <label className="block">
            <div className="mb-1.5 text-xs font-medium text-text-secondary">New password</div>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>

          {error ? <InlineError message={error} /> : null}
          {message ? <div className="text-sm text-text-muted">{message}</div> : null}

          <Button type="submit" disabled={busy || !token.trim() || newPassword.length < 6} className="w-full justify-center">
            {busy ? "Working…" : "Reset password"}
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

