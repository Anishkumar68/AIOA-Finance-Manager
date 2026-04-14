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
        <div className="text-sm font-semibold text-white">Account</div>
        <div className="mt-3 space-y-2 text-sm text-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="text-slate-300">Name</div>
            <div>{auth.user?.name}</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-slate-300">Email</div>
            <div>{auth.user?.email}</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-slate-300">Status</div>
            <div>{auth.user?.is_active ? "active" : "inactive"}</div>
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
