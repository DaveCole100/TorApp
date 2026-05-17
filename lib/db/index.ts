import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Singleton connection for server-side use
const globalForDb = globalThis as unknown as { _pgClient?: ReturnType<typeof postgres> };

function getClient() {
  if (!globalForDb._pgClient) {
    globalForDb._pgClient = postgres(process.env.DATABASE_URL!, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return globalForDb._pgClient;
}

export const db = drizzle(getClient(), { schema });
export * from "./schema";
