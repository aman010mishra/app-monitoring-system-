import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useListAlerts, useAcknowledgeAlert,
  getListAlertsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Filter, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

type Severity = "all" | "critical" | "warning" | "info";
type Category = "all" | "apm" | "infrastructure" | "ux" | "business";

function SevIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
  if (severity === "warning") return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
  return <Info className="w-3.5 h-3.5 text-blue-400" />;
}

export default function Alerts() {
  const [severity, setSeverity] = useState<Severity>("all");
  const [category, setCategory] = useState<Category>("all");
  const qc = useQueryClient();

  const { data: alerts, isLoading } = useListAlerts({ query: { queryKey: getListAlertsQueryKey() } });
  const ackMutation = useAcknowledgeAlert({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      },
    },
  });

  const filtered = alerts?.filter((a) => {
    if (severity !== "all" && a.severity !== severity) return false;
    if (category !== "all" && a.category !== category) return false;
    return true;
  }) ?? [];

  const sevs: Severity[] = ["all", "critical", "warning", "info"];
  const cats: Category[] = ["all", "apm", "infrastructure", "ux", "business"];

  const unacked = alerts?.filter((a) => !a.acknowledged).length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alerts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unacked} unacknowledged alert{unacked !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-card border border-card-border rounded-lg p-1">
          <span className="text-xs text-muted-foreground px-2">
            <Filter className="w-3 h-3 inline mr-1" />Severity
          </span>
          {sevs.map((s) => (
            <button key={s} onClick={() => setSeverity(s)}
              className={cn("px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors", {
                "bg-primary text-primary-foreground": severity === s,
                "text-muted-foreground hover:text-foreground": severity !== s,
              })}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-card border border-card-border rounded-lg p-1">
          <span className="text-xs text-muted-foreground px-2">Category</span>
          {cats.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn("px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors", {
                "bg-primary text-primary-foreground": category === c,
                "text-muted-foreground hover:text-foreground": category !== c,
              })}>{c}</button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-2">
        {isLoading && (
          <div className="text-xs text-muted-foreground py-8 text-center">Loading alerts...</div>
        )}
        {filtered.length === 0 && !isLoading && (
          <div className="bg-card border border-card-border rounded-xl py-12 text-center">
            <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground mt-1">No alerts matching current filters</p>
          </div>
        )}
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={cn("bg-card border rounded-xl p-4 flex items-start gap-4 transition-opacity", {
              "border-red-500/30": alert.severity === "critical" && !alert.acknowledged,
              "border-amber-500/20": alert.severity === "warning" && !alert.acknowledged,
              "border-card-border": alert.acknowledged || alert.severity === "info",
              "opacity-50": alert.acknowledged,
            })}
          >
            <div className={cn("mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg shrink-0", {
              "bg-red-500/10": alert.severity === "critical",
              "bg-amber-500/10": alert.severity === "warning",
              "bg-blue-500/10": alert.severity === "info",
            })}>
              <SevIcon severity={alert.severity} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">{alert.title}</span>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", {
                  "bg-red-500/10 text-red-400": alert.severity === "critical",
                  "bg-amber-500/10 text-amber-400": alert.severity === "warning",
                  "bg-blue-500/10 text-blue-400": alert.severity === "info",
                })}>{alert.severity}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{alert.category}</span>
                {alert.acknowledged && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Acknowledged
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
              <p className="text-xs text-muted-foreground/60 mt-1.5">
                {new Date(alert.createdAt).toLocaleString()}
                {alert.acknowledgedAt && ` · Acknowledged ${new Date(alert.acknowledgedAt).toLocaleString()}`}
              </p>
            </div>

            {!alert.acknowledged && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs h-7"
                onClick={() => ackMutation.mutate({ id: alert.id })}
                disabled={ackMutation.isPending}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Acknowledge
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
