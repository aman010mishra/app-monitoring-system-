import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useGetBusinessSummary, useGetBusinessHistory,
  getGetBusinessSummaryQueryKey, getGetBusinessHistoryQueryKey,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Users, DollarSign, UserPlus, UserMinus } from "lucide-react";

type Range = "1h" | "6h" | "24h" | "7d";

function KpiCard({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Business() {
  const [range, setRange] = useState<Range>("1h");
  const { data: summary } = useGetBusinessSummary({ query: { queryKey: getGetBusinessSummaryQueryKey() } });
  const { data: history } = useGetBusinessHistory({ range }, { query: { queryKey: getGetBusinessHistoryQueryKey({ range }) } });

  const chartData = history?.map((p, i) => ({
    t: i,
    users: p.activeUsers,
    revenue: p.revenue,
    signups: p.signups,
    conversions: p.conversions,
  })) ?? [];

  const ranges: Range[] = ["1h", "6h", "24h", "7d"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Business Metrics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Engagement, revenue, and growth indicators</p>
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
        <KpiCard label="Daily Active Users" value={((summary?.dailyActiveUsers ?? 0) / 1000).toFixed(1) + "k"} icon={Users} color="hsl(217 91% 60%)" sub="Unique users today" />
        <KpiCard label="Weekly Active Users" value={((summary?.weeklyActiveUsers ?? 0) / 1000).toFixed(1) + "k"} icon={Users} color="hsl(280 65% 60%)" sub="Last 7 days" />
        <KpiCard label="Conversion Rate" value={`${summary?.conversionRate ?? 0}%`} icon={TrendingUp} color="hsl(142 71% 45%)" sub="Visitors to customers" />
        <KpiCard label="Revenue Today" value={`$${((summary?.revenueToday ?? 0) / 1000).toFixed(1)}k`} icon={DollarSign} color="hsl(38 92% 50%)" sub="Running total" />
        <KpiCard label="New Signups" value={(summary?.newSignups ?? 0).toString()} icon={UserPlus} color="hsl(142 71% 45%)" sub={`Churn: ${summary?.churnRate ?? 0}%`} />
      </div>

      {/* Active users chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Active Users</h2>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bizUserGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" />
                <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215 20.2% 65.1%)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(222 47% 7%)", border: "1px solid hsl(217 33% 15%)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [v.toLocaleString(), "Active Users"]}
                  labelFormatter={() => ""}
                />
                <Area type="monotone" dataKey="users" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#bizUserGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">Revenue</h2>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" />
                <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215 20.2% 65.1%)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(222 47% 7%)", border: "1px solid hsl(217 33% 15%)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [`$${v.toFixed(0)}`, "Revenue"]}
                  labelFormatter={() => ""}
                />
                <Bar dataKey="revenue" fill="hsl(38 92% 50%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Signups + conversions */}
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-foreground">Signups &amp; Conversions</h2>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" />
              <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20.2% 65.1%)" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(222 47% 7%)", border: "1px solid hsl(217 33% 15%)", borderRadius: "8px", fontSize: "12px" }}
                labelFormatter={() => ""}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="signups" name="Signups" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="conversions" name="Conversions" stroke="hsl(280 65% 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
