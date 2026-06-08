import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useGetUxSummary, useGetUxHistory, useGetUxErrors,
  getGetUxSummaryQueryKey, getGetUxHistoryQueryKey, getGetUxErrorsQueryKey,
} from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Clock, Bug, AlertOctagon, CheckCircle } from "lucide-react";

type Range = "1h" | "6h" | "24h" | "7d";

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function UX() {
  const [range, setRange] = useState<Range>("1h");
  const { data: summary } = useGetUxSummary({ query: { queryKey: getGetUxSummaryQueryKey() } });
  const { data: history } = useGetUxHistory({ range }, { query: { queryKey: getGetUxHistoryQueryKey({ range }) } });
  const { data: errors } = useGetUxErrors({ query: { queryKey: getGetUxErrorsQueryKey() } });

  const chartData = history?.map((p, i) => ({ t: i, ms: p.value })) ?? [];
  const ranges: Range[] = ["1h", "6h", "24h", "7d"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Experience</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Sessions, page performance, and frontend errors</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-card-border rounded-lg p-1">
          {ranges.map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", {
                "bg-primary text-primary-foreground": range === r,
                "text-muted-foreground hover:text-foreground": range !== r,
              })}>{r}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Active Sessions" value={(summary?.activeSessions ?? 0).toLocaleString()} icon={Users} color="hsl(217 91% 60%)" sub="Current live users" />
        <StatCard label="Avg Page Load" value={`${((summary?.avgPageLoadTime ?? 0) / 1000).toFixed(2)}s`} icon={Clock} color="hsl(38 92% 50%)" sub="Time to interactive" />
        <StatCard label="Bounce Rate" value={`${summary?.bounceRate ?? 0}%`} icon={AlertOctagon} color="hsl(0 84% 60%)" sub="Single-page visits" />
        <StatCard label="Satisfaction" value={`${summary?.satisfactionScore ?? 0}/100`} icon={CheckCircle} color="hsl(142 71% 45%)" sub="CSAT score" />
        <StatCard label="Crash Rate" value={`${summary?.crashRate ?? 0}%`} icon={Bug} color="hsl(0 84% 60%)" sub="Fatal errors" />
      </div>

      {/* Page load chart */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Page Load Time Trend</h2>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="uxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" />
              <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20.2% 65.1%)" }} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip
                contentStyle={{ background: "hsl(222 47% 7%)", border: "1px solid hsl(217 33% 15%)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => [`${v.toFixed(0)}ms`, "Page Load"]}
                labelFormatter={() => ""}
              />
              <Area type="monotone" dataKey="ms" stroke="hsl(38 92% 50%)" strokeWidth={2} fill="url(#uxGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error log */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Bug className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Frontend Error Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background/30">
                {["Error Message", "Type", "Count", "Affected Users", "Last Seen", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 first:px-4 py-2.5 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {errors?.map((e) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-background/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-foreground/80 max-w-xs truncate">{e.message}</td>
                  <td className="px-4 py-3 text-amber-400 font-medium">{e.type}</td>
                  <td className="px-4 py-3 font-mono text-foreground">{e.count.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{e.affectedUsers}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(e.lastSeen).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", {
                      "bg-red-500/10 text-red-400": e.status === "open",
                      "bg-emerald-500/10 text-emerald-400": e.status === "resolved",
                    })}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
