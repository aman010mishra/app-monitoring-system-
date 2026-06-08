import { cn } from "@/lib/utils";
import { useGetDashboardSummary, useListAlerts, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Activity, Server, Users, TrendingUp, Bell, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", {
      "bg-emerald-500/10 text-emerald-400": status === "healthy",
      "bg-amber-500/10 text-amber-400": status === "degraded",
      "bg-red-500/10 text-red-400": status === "critical",
      "bg-slate-500/10 text-slate-400": !status,
    })}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-emerald-400": status === "healthy",
        "bg-amber-400": status === "degraded",
        "bg-red-500": status === "critical",
        "bg-slate-500": !status,
      })} />
      {status ?? "unknown"}
    </span>
  );
}

function MetricCard({
  title, value, sub, status, icon: Icon, trend,
}: {
  title: string; value: string; sub: string; status?: string;
  icon: React.ElementType; trend?: number[];
}) {
  const sparkData = trend?.map((v, i) => ({ i, v })) ?? [];
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      {sparkData.length > 0 && (
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="hsl(217 91% 60%)" strokeWidth={1.5} fill="url(#spark)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function LiveMetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: alerts } = useListAlerts();
  const { isConnected, liveMetrics } = useWebSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (liveMetrics) {
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    }
  }, [liveMetrics, qc]);

  const unacknowledgedAlerts = alerts?.filter((a) => !a.acknowledged) ?? [];
  const criticalAlerts = unacknowledgedAlerts.filter((a) => a.severity === "critical");

  const spark = [42, 51, 38, 65, 59, 72, 68, 81, 74, 69, 75, 80];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">System-wide monitoring overview</p>
        </div>
        <div className="flex items-center gap-2">
          {criticalAlerts.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? "s" : ""}
            </div>
          )}
          {isConnected && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </div>
          )}
        </div>
      </div>

      {/* Overall status banner */}
      {summary && (
        <div className={cn("rounded-xl border px-4 py-3 flex items-center gap-3", {
          "bg-emerald-500/5 border-emerald-500/20": summary.overallStatus === "healthy",
          "bg-amber-500/5 border-amber-500/20": summary.overallStatus === "degraded",
          "bg-red-500/5 border-red-500/20": summary.overallStatus === "critical",
        })}>
          {summary.overallStatus === "healthy" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className={cn("w-4 h-4 shrink-0", {
              "text-amber-400": summary.overallStatus === "degraded",
              "text-red-400": summary.overallStatus === "critical",
            })} />
          )}
          <div>
            <span className={cn("text-sm font-medium capitalize", {
              "text-emerald-400": summary.overallStatus === "healthy",
              "text-amber-400": summary.overallStatus === "degraded",
              "text-red-400": summary.overallStatus === "critical",
            })}>
              System {summary.overallStatus}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {summary.activeAlerts} active alert{summary.activeAlerts !== 1 ? "s" : ""} across all services
            </span>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="APM"
          value={`${summary?.apm.avgResponseTime ?? 0}ms`}
          sub={`${summary?.apm.errorRate ?? 0}% error rate · ${summary?.apm.throughput ?? 0} req/s`}
          status={summary?.apm.status}
          icon={Activity}
          trend={spark}
        />
        <MetricCard
          title="Infrastructure"
          value={`${summary?.infrastructure.cpuUsage ?? 0}%`}
          sub={`CPU · ${summary?.infrastructure.memoryUsage ?? 0}% memory · ${summary?.infrastructure.uptime ?? 0}% uptime`}
          status={summary?.infrastructure.status}
          icon={Server}
          trend={spark.map((v) => v * 0.8 + 10)}
        />
        <MetricCard
          title="User Experience"
          value={`${((summary?.ux.avgPageLoadTime ?? 0) / 1000).toFixed(1)}s`}
          sub={`${summary?.ux.activeSessions ?? 0} sessions · ${summary?.ux.bounceRate ?? 0}% bounce`}
          status={summary?.ux.status}
          icon={Users}
          trend={spark.map((v) => v * 1.1)}
        />
        <MetricCard
          title="Business"
          value={`${((summary?.business.dailyActiveUsers ?? 0) / 1000).toFixed(1)}k`}
          sub={`DAU · $${((summary?.business.revenueToday ?? 0) / 1000).toFixed(1)}k revenue today`}
          status={summary?.business.status}
          icon={TrendingUp}
          trend={spark.map((v) => v * 0.9 + 5)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live metrics */}
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Live Metrics</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="w-3 h-3" />
              Real-time
            </div>
          </div>
          {liveMetrics ? (
            <div className="space-y-3">
              <LiveMetricBar label="CPU" value={liveMetrics.cpu} color="hsl(217 91% 60%)" />
              <LiveMetricBar label="Memory" value={liveMetrics.memory} color="hsl(142 71% 45%)" />
              <LiveMetricBar label="Error Rate" value={liveMetrics.errorRate} color="hsl(0 84% 60%)" />
              <div className="space-y-1 pt-1 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Throughput</span>
                  <span className="font-mono text-foreground">{liveMetrics.throughput.toFixed(0)} req/s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Sessions</span>
                  <span className="font-mono text-foreground">{liveMetrics.activeSessions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Connecting to live feed...</div>
          )}
        </div>

        {/* Recent alerts */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Alerts</h2>
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {unacknowledgedAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-background/50 border border-border/50">
                <span className={cn("mt-0.5 inline-flex w-2 h-2 rounded-full shrink-0", {
                  "bg-red-500": alert.severity === "critical",
                  "bg-amber-400": alert.severity === "warning",
                  "bg-blue-400": alert.severity === "info",
                })} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{alert.message}</p>
                </div>
                <span className={cn("text-xs font-medium capitalize shrink-0", {
                  "text-red-400": alert.severity === "critical",
                  "text-amber-400": alert.severity === "warning",
                  "text-blue-400": alert.severity === "info",
                })}>{alert.severity}</span>
              </div>
            ))}
            {unacknowledgedAlerts.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">No active alerts</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
