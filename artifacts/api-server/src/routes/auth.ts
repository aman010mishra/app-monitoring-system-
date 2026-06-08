import { Router, type IRouter } from "express";
import { readStore, writeStore } from "../lib/store";

const router: IRouter = Router();

interface StoredUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
}

function toPublicUser(u: StoredUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    permissions: u.permissions,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
  };
}

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const users = readStore<StoredUser>("users", []);
  const user = users.find((u) => u.email === email && u.passwordHash === password);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status !== "active") {
    res.status(403).json({ error: "Account is not active" });
    return;
  }

  const updated = users.map((u) =>
    u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
  );
  writeStore("users", updated);

  const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString("base64");

  res.json({ user: toPublicUser({ ...user, lastLogin: new Date().toISOString() }), token });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

router.get("/auth/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString("utf-8");
    const [idStr] = decoded.split(":");
    const id = parseInt(idStr, 10);
    const users = readStore<StoredUser>("users", []);
    const user = users.find((u) => u.id === id);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json(toPublicUser(user));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
