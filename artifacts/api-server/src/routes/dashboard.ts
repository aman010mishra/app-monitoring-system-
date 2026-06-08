import { Router, type IRouter } from "express";
import { readStore } from "../lib/store";

const router: IRouter = Router();

interface Alert {
  id: number;
  acknowledged: boolean;
}

router.get("/dashboard/summary", (_req, res) => {
  const alerts = readStore<Alert>("alerts", []);
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;

  res.json({
    overallStatus: activeAlerts > 2 ? "critical" : activeAlerts > 0 ? "degraded" : "healthy",
    apm: {
      avgResponseTime: 187,
      p95ResponseTime: 423,
      errorRate: 2.4,
      throughput: 843,
      apdex: 0.91,
      status: "healthy",
    },
    infrastructure: {
      cpuUsage: 54,
      memoryUsage: 68,
      diskUsage: 61,
      networkIn: 124,
      networkOut: 87,
      uptime: 99.95,
      status: "degraded",
    },
    ux: {
      activeSessions: 1847,
      avgPageLoadTime: 2340,
      bounceRate: 28.4,
      satisfactionScore: 76,
      crashRate: 0.8,
      status: "degraded",
    },
    business: {
      dailyActiveUsers: 14832,
      weeklyActiveUsers: 68420,
      conversionRate: 2.8,
      revenueToday: 48750,
      newSignups: 312,
      churnRate: 1.2,
      status: "healthy",
    },
    activeAlerts,
  });
});

export default router;
