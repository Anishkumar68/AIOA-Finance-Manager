import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  Tag,
  ArrowLeftRight,
  HandCoins,
  Target,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  Download,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { exportTransactionsCsv } from "../lib/export";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
      { to: "/accounts",     label: "Accounts",     icon: CreditCard },
      { to: "/categories",   label: "Categories",   icon: Tag },
    ],
  },
  {
    label: "Money",
    items: [
      { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { to: "/udhar",        label: "Udhar Khata",  icon: HandCoins },
      { to: "/budgets",      label: "Budgets",      icon: Target },
      { to: "/reports",      label: "Reports",      icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings",     label: "Settings",     icon: Settings },
    ],
  },
];

function getInitials(email?: string) {
  if (!email) return "U";
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

export default function AppShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  function handleLogout() {
    auth.logout();
    navigate("/login", { replace: true });
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportTransactionsCsv();
    } catch (e: any) {
      alert(e?.message ? String(e.message) : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-base">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-surface-border bg-surface-raised">
        {/* Logo row */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-muted text-xs font-semibold text-white">
              A
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-text-primary">AIOA Finance</p>
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Personal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-border text-text-muted transition hover:bg-white/5 hover:text-text-secondary"
          >
            <LogOut size={13} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-muted">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2.5 rounded-lg border-l-2 px-2.5 py-2 text-[13px] font-medium transition",
                        isActive
                          ? "border-brand bg-brand-subtle text-brand-muted"
                          : "border-transparent text-text-muted hover:bg-white/5 hover:text-text-secondary",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={14} className={isActive ? "opacity-100" : "opacity-60"} />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-surface-border px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-muted text-[11px] font-semibold text-white">
              {getInitials(auth.user?.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-text-muted">{auth.user?.email}</p>
              <p className="text-[10px] text-text-muted">Free plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — page-level actions injected via context or slots if needed */}
        <header className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface-raised px-6 py-3.5">
          <div>
            <h1 className="text-[15px] font-semibold text-text-primary">Dashboard</h1>
            <p className="text-[12px] text-text-muted">Personal finance overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-transparent px-3 py-1.5 text-[12px] text-text-muted transition hover:bg-white/5 hover:text-text-secondary"
            >
              <Download size={12} /> {exporting ? "Exporting…" : "Export"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/transactions/new")}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-brand-light"
            >
              <Plus size={12} /> Add transaction
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surface-base p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
