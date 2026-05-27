import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Wallet,
  UserCheck,
  Settings,
  Menu,
  X,
  LogOut,
  FileText,
  Crown,
  Pencil,
  Gamepad2,
  RefreshCcw,
  ArrowRightLeft,
  Gift,
  Dices,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
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
  { title: "Admin Logs", url: "/dashboard/logs", icon: FileText },
  { title: "Create Bet", url: "/dashboard/create-bet", icon: Pencil },
  { title: "Game Bets", url: "/dashboard/game-bets", icon: Gamepad2 },
  { title: "Move Game Bal", url: "/dashboard/move-game", icon: ArrowRightLeft },
  { title: "Wingo", url: "/dashboard/wingo", icon: Dices },
];

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const NavContent = () => (
    <nav className="flex flex-col gap-0.5 p-2">
      {navItems.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === "/dashboard"}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-[11px] font-medium",
            sidebarCollapsed && "justify-center px-1"
          )}
          activeClassName="bg-primary/10 text-primary"
          onClick={() => setMobileOpen(false)}
          title={sidebarCollapsed ? item.title : undefined}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
        </NavLink>
      ))}
    </nav>
  );

  const pageTitle = location.pathname === "/dashboard"
    ? "Dashboard"
    : navItems.find((n) => n.url === location.pathname)?.title || location.pathname.split("/").pop();

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      <style>{`
        /* Hide scrollbars but keep scrolling */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 relative",
          sidebarCollapsed ? "w-16" : "w-44"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 z-20 bg-card border border-border rounded-full p-1 shadow-sm hover:bg-secondary transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRightIcon className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          )}
        </button>

        <div className={cn("p-4 border-b border-border flex items-center gap-2.5 overflow-hidden", sidebarCollapsed && "justify-center px-2")}>
          <img src={Logo} alt="Logo" className="w-8 h-8 object-contain bg-white flex-shrink-0" />
          {!sidebarCollapsed && (
            <div className="truncate">
              <h2 className="text-sm font-bold text-primary truncate">Admin</h2>
              <p className="text-[10px] text-muted-foreground truncate">Management Panel</p>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <NavContent />
        </div>
        <div className="p-2 border-t border-border">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-[11px] font-medium",
              sidebarCollapsed && "justify-center px-1"
            )}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-48 bg-card border-r border-border flex flex-col transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img src={Logo} alt="Logo" className="w-8 h-8 object-contain bg-white" />
            <h2 className="text-sm font-bold text-primary">Admin</h2>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <NavContent />
        </div>
        <div className="p-2 border-t border-border bg-card">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-[11px] font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden sm:block">ID: {user?.userId || user?.id}</span>
            <div className="w-6 h-6 bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[10px] font-bold">A</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 lg:p-5 overflow-auto no-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
