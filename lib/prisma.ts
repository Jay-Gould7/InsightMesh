import path from "node:path";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function normalizeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith("file:./")) {
    return;
  }

  const relativePath = databaseUrl.slice("file:".length);
  const absolutePath = path.resolve(process.cwd(), "prisma", relativePath).replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${absolutePath}`;
}

normalizeDatabaseUrl();

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
