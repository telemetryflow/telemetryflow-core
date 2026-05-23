import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "@/database/shared/BaseClickHouseMigration";

/**
 * Add ngrambf_v1 + tokenbf_v1 indexes on logs.body for fast full-text search.
 *
 * Without indexes, `positionCaseInsensitive(body, needle) > 0` (the replacement for
 * `body ILIKE '%...%'`) must read every granule regardless of match likelihood.
 *
 * ngrambf_v1 (n-gram bloom filter, n=4):
 *   - Splits body into overlapping 4-character n-grams ("conn", "onne", "nnec", ...)
 *   - Stores a bloom filter per granule — if the needle's n-grams are absent from
 *     the filter, the whole granule is skipped at scan time
 *   - Works for arbitrary substring search including partial-word matches
 *   - Used automatically by: LIKE '%x%', position(), positionCaseInsensitive()
 *
 * tokenbf_v1 (token bloom filter):
 *   - Tokenises body at non-alphanumeric boundaries
 *   - Faster and smaller than ngrambf for whole-word / multi-word searches
 *   - Used automatically by: hasToken(), hasTokenCaseInsensitive()
 *
 * Parameters for ngrambf_v1(n, bloom_size, hash_functions, seed):
 *   n=4, bloom_size=32768 bytes, hash_functions=3, seed=0
 *
 * Parameters for tokenbf_v1(bloom_size, hash_functions, seed):
 *   bloom_size=32768 bytes, hash_functions=3, seed=0
 *
 * GRANULARITY 1 — one filter per 8192-row granule (ClickHouse default).
 *
 * Note: MATERIALIZE INDEX runs in the background on existing data.
 * New inserts are indexed immediately at write time.
 */
export class AddLogsBodyTokenIndex1704240000010 extends BaseClickHouseMigration {
  name = "AddLogsBodyTokenIndex1704240000010";
  moduleName = "core";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Adding ngrambf_v1 + tokenbf_v1 indexes on logs.body...");

    // n-gram index: enables skipping for arbitrary substring searches
    await client.command({
      query: `
        ALTER TABLE ${database}.logs
          ADD INDEX IF NOT EXISTS idx_log_body_ngram
          (body)
          TYPE ngrambf_v1(4, 32768, 3, 0)
          GRANULARITY 1
      `,
    });

    // token index: enables fast whole-word and multi-word searches
    await client.command({
      query: `
        ALTER TABLE ${database}.logs
          ADD INDEX IF NOT EXISTS idx_log_body_tokens
          (body)
          TYPE tokenbf_v1(32768, 3, 0)
          GRANULARITY 1
      `,
    });

    this.log(
      "Materializing body indexes on existing log data (runs in background)...",
    );
    await client.command({
      query: `ALTER TABLE ${database}.logs MATERIALIZE INDEX idx_log_body_ngram`,
    });
    await client.command({
      query: `ALTER TABLE ${database}.logs MATERIALIZE INDEX idx_log_body_tokens`,
    });

    this.log("logs.body search indexes added.");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Dropping logs.body search indexes...");

    await client.command({
      query: `ALTER TABLE ${database}.logs DROP INDEX IF EXISTS idx_log_body_ngram`,
    });
    await client.command({
      query: `ALTER TABLE ${database}.logs DROP INDEX IF EXISTS idx_log_body_tokens`,
    });

    this.log("logs.body search indexes dropped.");
  }
}
