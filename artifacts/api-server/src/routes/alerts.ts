import { Router, type IRouter } from "express";
import { readStore, writeStore } from "../lib/store";

const router: IRouter = Router();

interface Alert {
  id: number;
  title: string;
  severity: string;
  category: string;
  message: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

router.get("/alerts", (_req, res) => {
  const alerts = readStore<Alert>("alerts", []);
  res.json(alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.patch("/alerts/:id/acknowledge", (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  const alerts = readStore<Alert>("alerts", []);
  const idx = alerts.findIndex((a) => a.id === id);

  if (idx === -1) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const updated = {
    ...alerts[idx]!,
    acknowledged: true,
    acknowledgedAt: new Date().toISOString(),
  };

  const newList = [...alerts];
  newList[idx] = updated;
  writeStore("alerts", newList);
  res.json(updated);
});

export default router;
