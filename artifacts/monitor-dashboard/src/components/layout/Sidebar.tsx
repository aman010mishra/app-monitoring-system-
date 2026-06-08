import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Activity, Server, Users, TrendingUp,
  Bell, Shield, LogOut, Wifi, WifiOff, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useListAlerts, useGetDashboardSummary } from "@workspace/api-client-react";
import { useWebSocket } from "@/hooks/useWebSocket";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apm", label: "APM", icon: Activity },
  { href: "/infrastructure", label: "Infrastructure", icon: Server },
  { href: "/ux", label: "User Experience", icon: Users },
  { href: "/business", label: "Business", icon: TrendingUp },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

function StatusDot({ status }: { status?: string }) {
  return (
    <Circle
      className={cn("w-2 h-2 fill-current", {
        "text-emerald-400": status === "healthy",
        "text-amber-400": status === "degraded",
        "text-red-500": status === "critical",
        "text-slate-500": !status,
      })}
    />
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, clearAuth } = useAuth();
  const { isConnected } = useWebSocket();
  const { data: alerts } = useListAlerts();
  const { data: summary } = useGetDashboardSummary();

  const unacknowledged = alerts?.filter((a) => !a.acknowledged).length ?? 0;

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground leading-tight">AppMonitor</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <StatusDot status={summary?.overallStatus} />
            <span className={cn("text-xs capitalize", {
              "text-emerald-400": summary?.overallStatus === "healthy",
              "text-amber-400": summary?.overallStatus === "degraded",
              "text-red-500": summary?.overallStatus === "critical",
              "text-slate-500": !summary?.overallStatus,
            })}>
              {summary?.overallStatus ?? "connecting"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" aria-label="Live" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-slate-500" aria-label="Disconnected" />
          )}
          {isConnected && (
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || location.startsWith(href + "/");
          const isAlerts = href === "/alerts";
          return (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isAlerts && unacknowledged > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold bg-red-500 text-white rounded-full">
                    {unacknowledged}
                  </span>
                )}
              </a>
            </Link>
          );
        })}

        {isAdmin && (
          <Link href="/admin">
            <a
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location === "/admin"
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Admin</span>
            </a>
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={clearAuth}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground/80 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
