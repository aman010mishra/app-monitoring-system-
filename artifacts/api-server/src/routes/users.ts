import { Router, type IRouter } from "express";
import { readStore, writeStore, nextId } from "../lib/store";

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

router.get("/users", (_req, res) => {
  const users = readStore<StoredUser>("users", []);
  res.json(users.map(toPublicUser));
});

router.post("/users", (req, res) => {
  const { name, email, password, role, permissions } = req.body as {
    name: string;
    email: string;
    password: string;
    role: string;
    permissions?: string[];
  };

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "name, email, password, and role are required" });
    return;
  }

  const users = readStore<StoredUser>("users", []);
  if (users.find((u) => u.email === email)) {
    res.status(400).json({ error: "Email already exists" });
    return;
  }

  const newUser: StoredUser = {
    id: nextId(users),
    name,
    email,
    passwordHash: password,
    role,
    status: "active",
    permissions: permissions ?? [],
    lastLogin: null,
    createdAt: new Date().toISOString(),
  };

  writeStore("users", [...users, newUser]);
  res.status(201).json(toPublicUser(newUser));
});

router.get("/users/:id", (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  const users = readStore<StoredUser>("users", []);
  const user = users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

router.patch("/users/:id", (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  const users = readStore<StoredUser>("users", []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { name, email, status, role } = req.body as Partial<{
    name: string;
    email: string;
    status: string;
    role: string;
  }>;

  const updated = { ...users[idx]! };
  if (name !== undefined) updated.name = name;
  if (email !== undefined) updated.email = email;
  if (status !== undefined) updated.status = status;
  if (role !== undefined) updated.role = role;

  const newList = [...users];
  newList[idx] = updated;
  writeStore("users", newList);
  res.json(toPublicUser(updated));
});

router.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  const users = readStore<StoredUser>("users", []);
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  writeStore("users", filtered);
  res.status(204).send();
});

router.patch("/users/:id/permissions", (req, res) => {
  const id = parseInt(req.params["id"] ?? "", 10);
  const users = readStore<StoredUser>("users", []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { role, permissions } = req.body as { role: string; permissions: string[] };
  if (!role || !Array.isArray(permissions)) {
    res.status(400).json({ error: "role and permissions are required" });
    return;
  }

  const updated = { ...users[idx]!, role, permissions };
  const newList = [...users];
  newList[idx] = updated;
  writeStore("users", newList);
  res.json(toPublicUser(updated));
});

export default router;
