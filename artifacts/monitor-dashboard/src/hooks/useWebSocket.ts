import { useEffect, useRef, useState, useCallback } from "react";

export interface WsMetricsPayload {
  cpu: number;
  memory: number;
  errorRate: number;
  throughput: number;
  activeSessions: number;
  timestamp: string;
}

interface WsMessage {
  type: string;
  payload: WsMetricsPayload;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<WsMetricsPayload | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    const url = `${protocol}//${window.location.host}${base}/ws`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          if (msg.type === "metrics_update" && mountedRef.current) {
            setLiveMetrics(msg.payload);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      if (mountedRef.current) {
        reconnectTimeout.current = setTimeout(connect, 5000);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, liveMetrics };
}
