import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

function randomBetween(min: number, max: number) {
  return +(min + Math.random() * (max - min)).toFixed(2);
}

function broadcastMetrics() {
  if (wss.clients.size === 0) return;

  const payload = {
    type: "metrics_update",
    payload: {
      cpu: randomBetween(30, 88),
      memory: randomBetween(50, 92),
      errorRate: randomBetween(0.5, 8),
      throughput: randomBetween(600, 1100),
      activeSessions: Math.round(randomBetween(1400, 2200)),
      timestamp: new Date().toISOString(),
    },
  };

  const msg = JSON.stringify(payload);
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

setInterval(broadcastMetrics, 3000);

wss.on("connection", (ws) => {
  logger.info("WebSocket client connected");
  ws.on("close", () => logger.info("WebSocket client disconnected"));
  ws.on("error", (err) => logger.error({ err }, "WebSocket error"));
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
