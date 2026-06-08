import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useGetInfrastructureSummary, useGetInfrastructureHistory, useListServers,
  getGetInfrastructureSummaryQueryKey, getGetInfrastructureHistoryQueryKey, getListServersQueryKey,
} from "@workspace/api-client-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Server, Cpu, HardDrive, Wifi, ArrowUp, ArrowDown } from "lucide-react";

type Range = "1h" | "6h" | "24h" | "7d";

function GaugeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function ServerRow({ s }: { s: { id: number; name: string; ip: string; status: string; cpuUsage: number; memoryUsage: number; diskUsage: number; uptime?: number; region?: string | null } }) {
  return (
    <tr className="border-b border-border/50 hover:bg-background/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full shrink-0", {
            "bg-emerald-400": s.status === "online",
            "bg-amber-400": s.status === "degraded",
            "bg-red-500": s.status === "offline",
          })} />
          <span className="text-xs font-mono text-foreground">{s.name}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{s.ip}</td>
      <td className="px-3 py-3 text-xs text-muted-foreground">{s.region ?? "—"}</td>
      <td className="px-3 py-3">
        <span className={cn("text-xs font-medium capitalize", {
          "text-emerald-400": s.status === "online",
          "text-amber-400": s.status === "degraded",
          "text-red-400": s.status === "offline",
        })}>{s.status}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${s.cpuUsage}%` }} />
          </div>
          <span className="text-xs font-mono text-foreground">{s.cpuUsage}%</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.memoryUsage}%` }} />
          </div>
          <span className="text-xs font-mono text-foreground">{s.memoryUsage}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.uptime != null ? `${s.uptime}%` : "—"}</td>
    </tr>
  );
}

export default function Infrastructure() {
  const [range, setRange] = useState<Range>("1h");
  const { data: summary } = useGetInfrastructureSummary({ query: { queryKey: getGetInfrastructureSummaryQueryKey() } });
  const { data: history } = useGetInfrastructureHistory({ range }, { query: { queryKey: getGetInfrastructureHistoryQueryKey({ range }) } });
  const { data: servers } = useListServers({ query: { queryKey: getListServersQueryKey() } });
  const { liveMetrics } = useWebSocket();

  const chartData = history?.map((p, i) => ({ t: i, cpu: p.cpu, memory: p.memory, disk: p.disk })) ?? [];
  const ranges: Range[] = ["1h", "6h", "24h", "7d"];

  const liveCpu = liveMetrics?.cpu ?? summary?.cpuUsage ?? 0;
  const liveMemory = liveMetrics?.memory ?? summary?.memoryUsage ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Infrastructure</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Server health and resource utilization</p>
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

      {/* Gauges */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <GaugeBar label="CPU Usage (live)" value={liveCpu} color="hsl(217 91% 60%)" />
        <GaugeBar label="Memory Usage (live)" value={liveMemory} color="hsl(142 71% 45%)" />
        <GaugeBar label="Disk Usage" value={summary?.diskUsage ?? 0} color="hsl(38 92% 50%)" />
        <div className="bg-card border border-card-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">Network I/O</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowDown className="w-3 h-3 text-blue-400" /> In
              </div>
              <span className="text-sm font-bold text-blue-400">{summary?.networkIn ?? 0} Mbps</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUp className="w-3 h-3 text-emerald-400" /> Out
              </div>
              <span className="text-sm font-bold text-emerald-400">{summary?.networkOut ?? 0} Mbps</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-xs text-muted-foreground">Uptime</span>
              <span className="text-sm font-bold text-emerald-400">{summary?.uptime ?? 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* History chart */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Resource History</h2>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" />
              <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20.2% 65.1%)" }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "hsl(222 47% 7%)", border: "1px solid hsl(217 33% 15%)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                labelFormatter={() => ""}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="cpu" name="CPU" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="memory" name="Memory" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="disk" name="Disk" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Server list */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Server className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Server Fleet</h2>
          <span className="ml-auto text-xs text-muted-foreground">{servers?.length ?? 0} servers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/30">
                {["Server", "IP", "Region", "Status", "CPU", "Memory", "Uptime"].map((h) => (
                  <th key={h} className="text-left px-3 first:px-4 last:px-4 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servers?.map((s) => <ServerRow key={s.id} s={s} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
