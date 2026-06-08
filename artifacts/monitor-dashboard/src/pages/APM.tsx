import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useGetApmSummary, useGetApmHistory, useGetApmEndpoints,
  getGetApmSummaryQueryKey, getGetApmHistoryQueryKey,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Activity, TrendingDown, TrendingUp, Zap, AlertCircle } from "lucide-react";

type Range = "1h" | "6h" | "24h" | "7d";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusChip({ status }: { status?: string }) {
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", {
      "bg-emerald-500/10 text-emerald-400": status === "healthy",
      "bg-amber-500/10 text-amber-400": status === "degraded",
      "bg-red-500/10 text-red-400": status === "critical",
    })}>
      {status}
    </span>
  );
}

export default function APM() {
  const [range, setRange] = useState<Range>("1h");
  const { data: summary } = useGetApmSummary({ query: { queryKey: getGetApmSummaryQueryKey() } });
  const { data: history } = useGetApmHistory({ range }, { query: { queryKey: getGetApmHistoryQueryKey({ range }) } });
  const { data: endpoints } = useGetApmEndpoints();

  const chartData = history?.map((p, i) => ({
    t: i,
    rt: p.value,
  })) ?? [];

  const ranges: Range[] = ["1h", "6h", "24h", "7d"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Application Performance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Response times, error rates, and throughput</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-card-border rounded-lg p-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", {
                "bg-primary text-primary-foreground": range === r,
                "text-muted-foreground hover:text-foreground": range !== r,
              })}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Avg Response Time" value={`${summary?.avgResponseTime ?? 0}ms`} sub="Mean across all endpoints" color="hsl(217 91% 60%)" />
        <StatCard label="P95 Response Time" value={`${summary?.p95ResponseTime ?? 0}ms`} sub="95th percentile" color="hsl(38 92% 50%)" />
        <StatCard label="Error Rate" value={`${summary?.errorRate ?? 0}%`} sub="HTTP 4xx + 5xx" color="hsl(0 84% 60%)" />
        <StatCard label="Throughput" value={`${summary?.throughput ?? 0}`} sub="Requests / second" color="hsl(142 71% 45%)" />
        <StatCard label="Apdex Score" value={`${summary?.apdex ?? 0}`} sub="User satisfaction index" color="hsl(280 65% 60%)" />
      </div>

      {/* Response time chart */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Response Time Over Time</h2>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" />
              <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20.2% 65.1%)" }} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip
                contentStyle={{ background: "hsl(222 47% 7%)", border: "1px solid hsl(217 33% 15%)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => [`${v.toFixed(1)}ms`, "Response Time"]}
                labelFormatter={() => ""}
              />
              <Area type="monotone" dataKey="rt" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#rtGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Endpoint table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Endpoint Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Endpoint</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Method</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Avg RT</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">P95 RT</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Error %</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Requests</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {endpoints?.map((ep, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-background/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-foreground/90">{ep.endpoint}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("font-mono font-bold text-xs", {
                      "text-blue-400": ep.method === "GET",
                      "text-emerald-400": ep.method === "POST",
                      "text-amber-400": ep.method === "PATCH",
                      "text-red-400": ep.method === "DELETE",
                    })}>{ep.method}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground">{ep.avgResponseTime}ms</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{ep.p95ResponseTime}ms</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono font-medium", {
                    "text-emerald-400": ep.errorRate < 1,
                    "text-amber-400": ep.errorRate >= 1 && ep.errorRate < 5,
                    "text-red-400": ep.errorRate >= 5,
                  })}>{ep.errorRate}%</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{ep.requestCount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right"><StatusChip status={ep.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
