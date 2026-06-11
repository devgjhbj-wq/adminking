import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Wallet,
  UserCheck,
  Menu,
  X,
  LogOut,
  Crown,
  Gamepad2,
  RefreshCcw,
  Gift,
  Dices,
  Search,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import TagsView from "@/components/TagsView";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/assets/logo.png";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "User Search", url: "/dashboard/users", icon: Users },
  { title: "Transactions", url: "/dashboard/transactions", icon: Receipt },
  { title: "Deposits", url: "/dashboard/deposits", icon: Wallet },
  { title: "Withdrawals", url: "/dashboard/withdrawals", icon: Wallet },
  { title: "Gift Codes", url: "/dashboard/gift-codes", icon: Gift },
  { title: "Agency", url: "/dashboard/agency", icon: UserCheck },
  { title: "VIP Config", url: "/dashboard/vip-config", icon: Crown },
  { title: "Turnover Config", url: "/dashboard/turnover-config", icon: RefreshCcw },
  { title: "Bet Records", url: "/dashboard/bet-records", icon: Gamepad2 },
  { title: "Wingo", url: "/dashboard/wingo", icon: Dices },
];

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pageTitle = location.pathname === "/dashboard"
    ? "Dashboard"
    : navItems.find((n) => n.url === location.pathname)?.title || location.pathname.split("/").pop();

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .fade-transform-enter { animation: fadeTransformIn 0.3s ease both; }
        @keyframes fadeTransformIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pro-table {
          table-layout: fixed; width: 100%; max-width: 100%; border-collapse: collapse;
        }
        .pro-table th, .pro-table td {
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          border-bottom: 1px solid hsl(var(--border));
          padding: 10px 12px; text-align: left; font-size: 13px; color: hsl(var(--foreground));
        }
        .pro-table thead { position: sticky; top: 0; z-index: 1; }
        .pro-table thead tr { background: hsl(var(--muted)); }
        .pro-table thead tr th { font-weight: 600; font-size: 12px; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.05em; }
        .pro-table tbody tr { transition: background-color 0.2s ease; }
        .pro-table tbody tr:hover { background: hsl(var(--accent) / 0.06); }
        .el-table { table-layout: fixed; width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.4; color: hsl(var(--foreground)); }
        .el-table tbody { font-size: 13px; }
        .el-table tbody tr { transition: background-color 0.2s ease; border-bottom: 1px solid hsl(var(--border) / 0.5); }
        .el-table tbody tr:hover { background: hsl(var(--accent) / 0.06); }
        .el-table .cell { box-sizing: border-box; padding: 0 6px; word-break: break-word; overflow-wrap: break-word; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>

      {/* Desktop Overlay */}
      {desktopOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setDesktopOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Apple style */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-52 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
          desktopOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-11 flex items-center justify-between px-4 bg-sidebar border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary-foreground">K</span>
            </div>
            <span className="text-xs font-semibold tracking-wide text-sidebar-foreground/90">King Admin</span>
          </div>
          <button onClick={() => setDesktopOpen(false)} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/dashboard"}
                className="flex items-center gap-2.5 h-9 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all rounded-md text-xs font-medium"
                activeClassName="!text-primary !bg-primary/10"
                onClick={() => setDesktopOpen(false)}
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 h-9 w-full px-3 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all rounded-md text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-52 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-11 flex items-center justify-between px-4 bg-sidebar border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary-foreground">K</span>
            </div>
            <span className="text-xs font-semibold tracking-wide text-sidebar-foreground/90">King Admin</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/dashboard"}
                className="flex items-center gap-2.5 h-9 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all rounded-md text-xs font-medium"
                activeClassName="!text-primary !bg-primary/10"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 h-9 w-full px-3 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all rounded-md text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Apple-style header */}
        <header className="h-11 border-b border-border bg-card/80 backdrop-blur-lg flex items-center justify-between px-4 lg:px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDesktopOpen(true)}
              className="hidden lg:inline-flex text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <div className="w-px h-4 bg-border" />
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              ID: {user?.userId || user?.id}
            </span>
            <div className="w-7 h-7 bg-primary/15 rounded-full flex items-center justify-center">
              <span className="text-primary text-[11px] font-semibold">
                {(user?.name || user?.username || "A")?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <TagsView />

        <main className="flex-1 overflow-auto no-scrollbar">
          <div key={location.pathname} className="fade-transform-enter p-3 lg:p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;