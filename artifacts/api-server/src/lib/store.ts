import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger";

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const dataDir = path.resolve(workspaceRoot, "artifacts/api-server/data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function filePath(name: string) {
  return path.join(dataDir, `${name}.json`);
}

export function readStore<T>(name: string, defaultValue: T[]): T[] {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    writeStore(name, defaultValue);
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw) as T[];
  } catch (err) {
    logger.error({ err, name }, "Failed to read store");
    return defaultValue;
  }
}

export function writeStore<T>(name: string, data: T[]): void {
  const fp = filePath(name);
  try {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    logger.error({ err, name }, "Failed to write store");
  }
}

export function nextId<T extends { id: number }>(items: T[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}
