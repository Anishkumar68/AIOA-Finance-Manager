import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, SectionTitle } from "../components/ui";

export default function SettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <SectionTitle title="Settings" subtitle="Basic account settings and session control." />

      <Card>
        <div className="text-sm font-semibold text-text-primary">Account</div>
        <div className="mt-3 space-y-2 text-sm text-text-secondary">
          <div className="flex items-center justify-between gap-3">
            <div className="text-text-muted">Name</div>
            <div className="text-text-primary">{auth.user?.name}</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-text-muted">Email</div>
            <div className="text-text-primary">{auth.user?.email}</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-text-muted">Status</div>
            <div className="text-text-primary">{auth.user?.is_active ? "active" : "inactive"}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="danger"
            type="button"
            onClick={() => {
              auth.logout();
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}
