import pg from "pg";
import { unavailable } from "./errors.mjs";

const { Pool } = pg;
let sharedPool;

const poolLimit = (value) => {
  const parsed = Number.parseInt(value || "5", 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 20 ? parsed : 5;
};

export const databaseOptions = (env = process.env) => {
  const connectionString = String(env.DATABASE_URL || "").trim();
  if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) throw unavailable("The Office database is not configured.");
  const encodedCa = String(env.PG_CA_CERT_BASE64 || "").trim();
  const ssl = encodedCa
    ? { rejectUnauthorized: true, ca: Buffer.from(encodedCa, "base64").toString("utf8") }
    : { rejectUnauthorized: true };
  return {
    connectionString,
    ssl,
    max: poolLimit(env.OFFICE_DATABASE_POOL_MAX),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    allowExitOnIdle: true,
    application_name: "integrity-office",
  };
};

export const getPool = (env = process.env) => {
  if (!sharedPool) sharedPool = new Pool(databaseOptions(env));
  return sharedPool;
};

export const withTransaction = async (pool, callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '8s'");
    await client.query("SET LOCAL lock_timeout = '3s'");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

export const closeSharedPool = async () => {
  if (sharedPool) await sharedPool.end();
  sharedPool = undefined;
};

export const _internals = { poolLimit };
