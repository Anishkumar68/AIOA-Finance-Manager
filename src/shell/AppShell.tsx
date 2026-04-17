import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  Tag,
  ArrowLeftRight,
  Repeat,
  HandCoins,
  Target,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  Download,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { exportTransactionsCsv } from "../lib/export";
import { Button, IconButton } from "../components/ui";

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
      { to: "/recurring",    label: "Recurring",     icon: Repeat },
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
  const location = useLocation();
  const [exporting, setExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const routeMeta = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/transactions/new")) return { title: "Add transaction", subtitle: "Log income, expense, or transfer." };
    if (p.includes("/transactions/") && p.endsWith("/edit")) return { title: "Edit transaction", subtitle: "Fine-tune details and tags." };
    if (p.startsWith("/transactions")) return { title: "Transactions", subtitle: "Filter, search, and manage activity." };
    if (p.startsWith("/accounts")) return { title: "Accounts", subtitle: "Balances, currencies, and status." };
    if (p.startsWith("/categories")) return { title: "Categories", subtitle: "Keep income and expense taxonomy clean." };
    if (p.startsWith("/budgets")) return { title: "Budgets", subtitle: "Monthly limits by category." };
    if (p.startsWith("/recurring")) return { title: "Recurring", subtitle: "Automate repeating transactions." };
    if (p.startsWith("/udhar")) return { title: "Udhar Khata", subtitle: "Track lends, borrows, and repayments." };
    if (p.startsWith("/reports")) return { title: "Reports", subtitle: "Monthly summaries and breakdowns." };
    if (p.startsWith("/settings")) return { title: "Settings", subtitle: "Account and session preferences." };
    return { title: "Dashboard", subtitle: "Balance, this month’s totals, and recent activity." };
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-surface-base">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/12 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -right-40 h-[560px] w-[560px] rounded-full bg-brand-muted/8 blur-3xl" />

      {/* ── Sidebar ─────────────────────────────────────────── */}
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-surface-base/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col border-r border-surface-border",
          "bg-surface-raised/75 backdrop-blur supports-[backdrop-filter]:bg-surface-raised/60",
          "transform transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
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
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <IconButton label="Close sidebar" type="button" onClick={() => setSidebarOpen(false)}>
                <X size={14} />
              </IconButton>
            </div>
            <IconButton label="Logout" type="button" onClick={handleLogout}>
              <LogOut size={14} />
            </IconButton>
          </div>
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
                        "flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-[13px] font-medium transition",
                        isActive
                          ? "border-brand/25 bg-brand/10 text-text-primary"
                          : "text-text-muted hover:border-surface-border hover:bg-surface-card/40 hover:text-text-primary",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={15} className={isActive ? "opacity-100" : "opacity-65"} />
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
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top bar — page-level actions injected via context or slots if needed */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-surface-border bg-surface-raised/70 px-4 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-surface-raised/55 md:px-6">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <IconButton label="Open sidebar" type="button" onClick={() => setSidebarOpen(true)}>
                <Menu size={16} />
              </IconButton>
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-text-primary">{routeMeta.title}</h1>
              <p className="text-[12px] text-text-muted">{routeMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={handleExport} disabled={exporting}>
              <Download size={14} className="opacity-80" /> {exporting ? "Exporting…" : "Export"}
            </Button>
            <Button size="sm" type="button" onClick={() => navigate("/transactions/new")}>
              <Plus size={14} className="opacity-90" /> Add
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
