/**
 * Standalone LLM seed runner — runs only DefaultLLMProvidersSeed
 */
import "dotenv/config";
import { DataSource } from "typeorm";
import { DefaultLLMProvidersSeed } from "../src/modules/llm/infrastructure/persistence/seeds/01-DefaultLLMProvidersSeed";

async function main() {
  const ds = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    username:
      process.env.POSTGRES_USER || process.env.POSTGRES_USERNAME || "postgres",
    password: process.env.POSTGRES_PASSWORD || "telemetryflow123",
    database: process.env.POSTGRES_DB || "telemetryflow_db",
    ssl: false,
    connectTimeoutMS: 10000,
  });

  await ds.initialize();
  console.log("✅ Connected to Postgres");

  const seed = new DefaultLLMProvidersSeed();
  await seed.run(ds);

  await ds.destroy();
  console.log("✅ Done");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
