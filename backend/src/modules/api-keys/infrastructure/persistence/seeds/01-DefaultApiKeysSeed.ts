/**
 * API Keys Seed: Default platform API keys
 * Order: 01 (depends on organizations, default users)
 *
 * Seeds 3 API keys per organization (6 total):
 *
 * DEVOPSCORNER:
 *   1. System/Platform Key (is_system=true, cannot be deleted)
 *      Uses TELEMETRYFLOW_API_KEY_ID / TELEMETRYFLOW_API_KEY_SECRET / ENCRYPTION_KEY from .env
 *   2. Production Key
 *   3. Staging Key
 *
 * TELEMETRYFLOW:
 *   4. System/Platform Key (is_system=true, cannot be deleted)
 *   5. Production Key
 *   6. Staging Key
 *
 * Each key has 3 components:
 *   - api_key_id     (tfk_ prefix)  — TELEMETRYFLOW_API_KEY_ID
 *   - api_key_secret (SHA256 hash)  — TELEMETRYFLOW_API_KEY_SECRET
 *   - encrypt_key    (encrypted)    — ENCRYPTION_KEY
 */

import { DataSource } from "typeorm";
import { randomUUID } from "crypto";
import * as crypto from "crypto";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

/**
 * Encrypt a per-key encryption key using the platform ENCRYPTION_KEY (AES-256-GCM)
 */
function encryptWithPlatformKey(plaintext: string, platformKey: string): string {
  const key = crypto.createHash("sha256").update(platformKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]).toString("base64");
}

interface SeedApiKey {
  name: string;
  description: string;
  organization_code: string;
  key_type: "service" | "standard";
  is_system: boolean;
  api_key_id: string;
  api_key_secret_raw: string;
  encrypt_key_raw: string;
  permissions: string[];
  scopes: string[];
  environment: string;
}

export class DefaultApiKeysSeed extends BaseSeed {
  name = "DefaultApiKeysSeed";
  moduleName = "api-keys";
  order = 1;
  dependencies = ["DefaultUsersSeed", "OrganizationsSeed"];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding default API keys...");

    // Get both organizations
    const devOpsCorner = await this.findRecord<{ organization_id: string }>(
      dataSource,
      "organizations",
      { code: "DEVOPSCORNER" },
    );

    const telemetryFlow = await this.findRecord<{ organization_id: string }>(
      dataSource,
      "organizations",
      { code: "TELEMETRYFLOW" },
    );

    if (!devOpsCorner) {
      this.logError("DevOpsCorner organization not found. Run OrganizationsSeed first.");
      return;
    }

    if (!telemetryFlow) {
      this.logError("TelemetryFlow organization not found. Run OrganizationsSeed first.");
      return;
    }

    // Get super admin user as creator
    const superAdmin = await this.findRecord<{ id: string }>(
      dataSource,
      "users",
      { email: "superadmin.telemetryflow@telemetryflow.id" },
    );

    if (!superAdmin) {
      this.logError("Super admin user not found. Run DefaultUsersSeed first.");
      return;
    }

    // Platform ENCRYPTION_KEY for encrypting per-key encrypt_key values
    const platformEncryptionKey =
      process.env.ENCRYPTION_KEY ||
      "e7b50b196e27f3afa911638a934ff938e8083df0976071403e912f6fb46b510e";

    // ─────────────────────────────────────────────────────────────────────
    // Define all API keys
    // ─────────────────────────────────────────────────────────────────────

    const keys: SeedApiKey[] = [
      // ── 1. DevOpsCorner: System/Platform Key (from .env) ──
      {
        name: "TFO Platform Key — DevOpsCorner",
        description:
          "System API key for TFO-Agent and TFO-Collector machine-to-machine auth. Cannot be deleted.",
        organization_code: "DEVOPSCORNER",
        key_type: "service",
        is_system: true,
        api_key_id:
          process.env.TELEMETRYFLOW_API_KEY_ID ||
          "tfk_cd370b538e591cb26f69de626aecb95e",
        api_key_secret_raw:
          process.env.TELEMETRYFLOW_API_KEY_SECRET ||
          "tfs_a96f08dc1cd4166b2846ae9f808b151955d74fb875d46491fd7daf9d1ff0afde",
        encrypt_key_raw: platformEncryptionKey,
        permissions: [
          // Telemetry — full access (hierarchical: covers all telemetry:*:read/write/manage)
          "telemetry:read",
          "telemetry:write",
          "telemetry:manage",
          // Monitoring — full access (covers monitoring:agent:*, monitoring:vm:*, etc.)
          "monitoring:read",
          "monitoring:write",
          // Alerting
          "alerting:read",
          "alerting:write",
          // Dashboard
          "dashboard:read",
          "dashboard:write",
          // API Keys (for validation / self-management)
          "api-keys:read",
          "api-keys:write",
          "api-keys:validate",
          // Tenancy — read access for context
          "organizations:read",
          "organization:read",
          "workspaces:read",
          "workspace:read",
          "regions:read",
          "region:read",
          "tenants:read",
          "tenant:read",
          // Platform management
          "platform:manage",
          "platform:audit",
          "audit:read",
        ],
        scopes: ["agent", "collector", "otlp", "metrics", "traces", "logs", "alerts", "api"],
        environment: "system",
      },

      // ── 2. DevOpsCorner: Production Key ──
      {
        name: "DevOpsCorner Production API Key",
        description: "API key for DevOpsCorner production environment",
        organization_code: "DEVOPSCORNER",
        key_type: "service",
        is_system: false,
        api_key_id: "tfk_d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6",
        api_key_secret_raw:
          "tfs_2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4",
        encrypt_key_raw:
          "1a3b5c7d9e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b",
        permissions: [
          "monitoring:agent:read",
          "monitoring:agent:write",
          "telemetry:metrics:write",
          "telemetry:traces:write",
          "telemetry:logs:write",
        ],
        scopes: ["agent", "collector", "otlp"],
        environment: "production",
      },

      // ── 3. DevOpsCorner: Staging Key ──
      {
        name: "DevOpsCorner Staging API Key",
        description: "API key for DevOpsCorner staging environment",
        organization_code: "DEVOPSCORNER",
        key_type: "service",
        is_system: false,
        api_key_id: "tfk_f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6",
        api_key_secret_raw:
          "tfs_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
        encrypt_key_raw:
          "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8",
        permissions: [
          "monitoring:agent:read",
          "monitoring:agent:write",
          "telemetry:metrics:write",
          "telemetry:traces:write",
          "telemetry:logs:write",
        ],
        scopes: ["agent", "collector", "otlp"],
        environment: "staging",
      },

      // ── 4. TelemetryFlow: System/Platform Key ──
      {
        name: "TFO Platform Key — TelemetryFlow",
        description:
          "System API key for TFO-Agent and TFO-Collector machine-to-machine auth. Cannot be deleted.",
        organization_code: "TELEMETRYFLOW",
        key_type: "service",
        is_system: true,
        api_key_id: "tfk_e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8",
        api_key_secret_raw:
          "tfs_4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6",
        encrypt_key_raw:
          "3b5c7d9e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6",
        permissions: [
          // Telemetry — full access (hierarchical: covers all telemetry:*:read/write/manage)
          "telemetry:read",
          "telemetry:write",
          "telemetry:manage",
          // Monitoring — full access (covers monitoring:agent:*, monitoring:vm:*, etc.)
          "monitoring:read",
          "monitoring:write",
          // Alerting
          "alerting:read",
          "alerting:write",
          // Dashboard
          "dashboard:read",
          "dashboard:write",
          // API Keys (for validation / self-management)
          "api-keys:read",
          "api-keys:write",
          "api-keys:validate",
          // Tenancy — read access for context
          "organizations:read",
          "organization:read",
          "workspaces:read",
          "workspace:read",
          "regions:read",
          "region:read",
          "tenants:read",
          "tenant:read",
          // Platform management
          "platform:manage",
          "platform:audit",
          "audit:read",
        ],
        scopes: ["agent", "collector", "otlp", "metrics", "traces", "logs", "alerts", "api"],
        environment: "system",
      },

      // ── 5. TelemetryFlow: Production Key ──
      {
        name: "TelemetryFlow Production API Key",
        description: "API key for TelemetryFlow production environment",
        organization_code: "TELEMETRYFLOW",
        key_type: "service",
        is_system: false,
        api_key_id: "tfk_f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0",
        api_key_secret_raw:
          "tfs_6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8",
        encrypt_key_raw:
          "5c7d9e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8",
        permissions: [
          "monitoring:agent:read",
          "monitoring:agent:write",
          "telemetry:metrics:write",
          "telemetry:traces:write",
          "telemetry:logs:write",
        ],
        scopes: ["agent", "collector", "otlp"],
        environment: "production",
      },

      // ── 6. TelemetryFlow: Staging Key ──
      {
        name: "TelemetryFlow Staging API Key",
        description: "API key for TelemetryFlow staging environment",
        organization_code: "TELEMETRYFLOW",
        key_type: "service",
        is_system: false,
        api_key_id: "tfk_a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
        api_key_secret_raw:
          "tfs_b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
        encrypt_key_raw:
          "8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9",
        permissions: [
          "monitoring:agent:read",
          "monitoring:agent:write",
          "telemetry:metrics:write",
          "telemetry:traces:write",
          "telemetry:logs:write",
        ],
        scopes: ["agent", "collector", "otlp"],
        environment: "staging",
      },
    ];

    // ─────────────────────────────────────────────────────────────────────
    // Seed each key
    // ─────────────────────────────────────────────────────────────────────

    const orgMap: Record<string, string> = {
      DEVOPSCORNER: devOpsCorner.organization_id,
      TELEMETRYFLOW: telemetryFlow.organization_id,
    };

    let inserted = 0;
    for (const key of keys) {
      const organizationId = orgMap[key.organization_code];
      if (!organizationId) {
        this.logError(`Organization ${key.organization_code} not found, skipping: ${key.name}`);
        continue;
      }

      const secretSalt = crypto.randomBytes(16).toString("hex");
      const secretHash = crypto.scryptSync(key.api_key_secret_raw, secretSalt, 64).toString("hex");
      const apiKeySecret = `scrypt$${secretSalt}$${secretHash}`;
      const keyHint = key.api_key_secret_raw.slice(-4);

      // Encrypt the per-key encryption key with platform ENCRYPTION_KEY
      const encryptedEncryptKey = encryptWithPlatformKey(
        key.encrypt_key_raw,
        platformEncryptionKey,
      );

      const wasInserted = await this.insertIfNotExists(
        dataSource,
        "api_keys",
        {
          id: randomUUID(),
          organization_id: organizationId,
          workspace_id: null,
          name: key.name,
          description: key.description,
          key_type: key.key_type,
          api_key_id: key.api_key_id,
          key_prefix: "tfs_",
          api_key_secret: apiKeySecret,
          key_hint: keyHint,
          encrypt_key: encryptedEncryptKey,
          is_system: key.is_system,
          permissions: JSON.stringify(key.permissions),
          scopes: JSON.stringify(key.scopes),
          rate_limit: null,
          is_active: true,
          expires_at: null,
          last_used_at: null,
          last_used_ip: null,
          usage_count: 0,
          created_by: superAdmin.id,
          revoked_at: null,
          revoked_by: null,
          revocation_reason: null,
          rotated_at: null,
          rotated_by: null,
          rotation_count: 0,
          metadata: JSON.stringify({
            organization_code: key.organization_code,
            environment: key.environment,
            purpose: key.is_system
              ? "tfo-agent and tfo-collector native authentication"
              : `${key.environment} environment API access`,
          }),
        },
        "api_key_secret",
      );

      if (wasInserted) {
        this.logSuccess(`Created API key: ${key.name}`);
        inserted++;
      } else {
        // Idempotent refresh: update api_key_id (may be null/stale), permissions, scopes
        // Key by api_key_secret hash (guaranteed to exist since insertIfNotExists found it)
        await dataSource.query(
          `UPDATE api_keys SET api_key_id = $1, permissions = $2, scopes = $3, updated_at = NOW()
           WHERE api_key_secret = $4`,
          [
            key.api_key_id,
            JSON.stringify(key.permissions),
            JSON.stringify(key.scopes),
            apiKeySecret,
          ],
        );
        this.logSkip(`API key exists (api_key_id + permissions refreshed): ${key.name}`);
      }
    }

    this.log(
      `API keys seeded: ${inserted} created, ${keys.length - inserted} skipped`,
    );
  }
}