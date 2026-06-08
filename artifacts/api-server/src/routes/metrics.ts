import { Router, type IRouter } from "express";
import { readStore } from "../lib/store";

const router: IRouter = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateTimeSeries(
  range: string,
  generator: (i: number, total: number) => Record<string, unknown>
) {
  const points: Record<string, unknown>[] = [];
  const configs: Record<string, { count: number; intervalMs: number }> = {
    "1h": { count: 60, intervalMs: 60_000 },
    "6h": { count: 72, intervalMs: 300_000 },
    "24h": { count: 96, intervalMs: 900_000 },
    "7d": { count: 84, intervalMs: 7200_000 },
  };
  const cfg = configs[range] ?? configs["1h"]!;
  const now = Date.now();

  for (let i = cfg.count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * cfg.intervalMs).toISOString();
    points.push({ timestamp, ...generator(i, cfg.count) });
  }
  return points;
}

function jitter(base: number, pct = 0.15) {
  return +(base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(2);
}

// ─── APM ────────────────────────────────────────────────────────────────────

router.get("/metrics/apm", (_req, res) => {
  res.json({
    avgResponseTime: 187,
    p95ResponseTime: 423,
    errorRate: 2.4,
    throughput: 843,
    apdex: 0.91,
    status: "healthy",
  });
});

router.get("/metrics/apm/history", (req, res) => {
  const range = (req.query["range"] as string) || "1h";
  const data = generateTimeSeries(range, (i, total) => ({
    value: jitter(187 + Math.sin(i / (total / 6)) * 40),
    label: "response_time",
  }));
  res.json(data);
});

router.get("/metrics/apm/endpoints", (_req, res) => {
  res.json([
    { endpoint: "/api/users", method: "GET", avgResponseTime: 95, p95ResponseTime: 210, errorRate: 0.1, requestCount: 12400, status: "healthy" },
    { endpoint: "/api/orders", method: "GET", avgResponseTime: 143, p95ResponseTime: 380, errorRate: 0.8, requestCount: 8900, status: "healthy" },
    { endpoint: "/api/checkout", method: "POST", avgResponseTime: 312, p95ResponseTime: 890, errorRate: 7.3, requestCount: 3200, status: "critical" },
    { endpoint: "/api/products", method: "GET", avgResponseTime: 78, p95ResponseTime: 165, errorRate: 0.2, requestCount: 22100, status: "healthy" },
    { endpoint: "/api/search", method: "GET", avgResponseTime: 256, p95ResponseTime: 612, errorRate: 1.2, requestCount: 9700, status: "degraded" },
    { endpoint: "/api/auth/login", method: "POST", avgResponseTime: 188, p95ResponseTime: 340, errorRate: 3.1, requestCount: 4100, status: "degraded" },
    { endpoint: "/api/analytics", method: "GET", avgResponseTime: 540, p95ResponseTime: 1200, errorRate: 0.4, requestCount: 1800, status: "degraded" },
    { endpoint: "/api/notifications", method: "GET", avgResponseTime: 62, p95ResponseTime: 140, errorRate: 0.0, requestCount: 5600, status: "healthy" },
  ]);
});

// ─── Infrastructure ──────────────────────────────────────────────────────────

router.get("/metrics/infrastructure", (_req, res) => {
  res.json({
    cpuUsage: 54,
    memoryUsage: 68,
    diskUsage: 61,
    networkIn: 124,
    networkOut: 87,
    uptime: 99.95,
    status: "degraded",
  });
});

router.get("/metrics/infrastructure/history", (req, res) => {
  const range = (req.query["range"] as string) || "1h";
  const data = generateTimeSeries(range, (i, total) => ({
    cpu: jitter(54 + Math.sin(i / (total / 4)) * 18),
    memory: jitter(68 + Math.cos(i / (total / 8)) * 8),
    disk: jitter(61 + i * 0.01),
    networkIn: jitter(124 + Math.sin(i / 5) * 30),
    networkOut: jitter(87 + Math.sin(i / 7) * 20),
  }));
  res.json(data);
});

router.get("/metrics/infrastructure/servers", (_req, res) => {
  const servers = readStore("servers", []);
  res.json(servers);
});

// ─── User Experience ─────────────────────────────────────────────────────────

router.get("/metrics/ux", (_req, res) => {
  res.json({
    activeSessions: 1847,
    avgPageLoadTime: 2340,
    bounceRate: 28.4,
    satisfactionScore: 76,
    crashRate: 0.8,
    status: "degraded",
  });
});

router.get("/metrics/ux/history", (req, res) => {
  const range = (req.query["range"] as string) || "1h";
  const data = generateTimeSeries(range, (i, total) => ({
    value: jitter(2340 + Math.sin(i / (total / 5)) * 400),
  }));
  res.json(data);
});

router.get("/metrics/ux/errors", (_req, res) => {
  res.json([
    { id: 1, message: "TypeError: Cannot read properties of undefined (reading 'data')", type: "TypeError", count: 342, lastSeen: new Date(Date.now() - 120000).toISOString(), affectedUsers: 89, status: "open" },
    { id: 2, message: "ChunkLoadError: Loading chunk 47 failed", type: "ChunkLoadError", count: 128, lastSeen: new Date(Date.now() - 900000).toISOString(), affectedUsers: 34, status: "open" },
    { id: 3, message: "NetworkError: Failed to fetch /api/checkout", type: "NetworkError", count: 97, lastSeen: new Date(Date.now() - 1800000).toISOString(), affectedUsers: 61, status: "open" },
    { id: 4, message: "RangeError: Maximum call stack size exceeded", type: "RangeError", count: 43, lastSeen: new Date(Date.now() - 7200000).toISOString(), affectedUsers: 12, status: "resolved" },
    { id: 5, message: "SyntaxError: Unexpected token '<' in JSON", type: "SyntaxError", count: 19, lastSeen: new Date(Date.now() - 14400000).toISOString(), affectedUsers: 7, status: "resolved" },
  ]);
});

// ─── Business ────────────────────────────────────────────────────────────────

router.get("/metrics/business", (_req, res) => {
  res.json({
    dailyActiveUsers: 14832,
    weeklyActiveUsers: 68420,
    conversionRate: 2.8,
    revenueToday: 48750,
    newSignups: 312,
    churnRate: 1.2,
    status: "healthy",
  });
});

router.get("/metrics/business/history", (req, res) => {
  const range = (req.query["range"] as string) || "1h";
  const data = generateTimeSeries(range, (i, total) => ({
    activeUsers: Math.round(jitter(14832 + Math.sin(i / (total / 3)) * 2000)),
    revenue: jitter(48750 / (total > 60 ? total : 24) + Math.random() * 500),
    signups: Math.round(jitter(13 + Math.random() * 8)),
    conversions: Math.round(jitter(9 + Math.random() * 5)),
  }));
  res.json(data);
});

export default router;
