/**
 * LLM Seed Shared Helpers
 *
 * Shared types, encryption, and lookup utilities used by all LLM provider seeds.
 */

import { DataSource } from "typeorm";
import { randomUUID } from "crypto";
import * as crypto from "crypto";

/** Standalone AES-256-GCM encrypt (matches LLMEncryptionService) */
export function encryptApiKey(
  plaintext: string,
  encryptionKey: string,
): string {
  const key = crypto.createHash("sha256").update(encryptionKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]).toString(
    "base64",
  );
}

export interface LLMProviderData {
  name: string;
  provider_type: string;
  api_key_placeholder: string;
  base_url: string;
  model_id: string;
  model_config: string;
  is_default: boolean;
  is_active: boolean;
}

export interface LLMOrgContext {
  organizationId: string;
  superAdminId: string;
  encryptionKey: string;
}

/** Resolve org + super admin + encryption key — returns null if prerequisites missing */
export async function resolveLLMContext(
  dataSource: DataSource,
  findRecord: <T>(
    ds: DataSource,
    table: string,
    where: Record<string, string>,
  ) => Promise<T | null>,
  logError: (msg: string) => void,
): Promise<LLMOrgContext | null> {
  const contexts = await resolveAllLLMContexts(dataSource, findRecord, logError);
  return contexts.length > 0 ? contexts[0] : null;
}

/** Resolve ALL orgs + super admin + encryption key — returns array for multi-org seeding */
export async function resolveAllLLMContexts(
  dataSource: DataSource,
  findRecord: <T>(
    ds: DataSource,
    table: string,
    where: Record<string, string>,
  ) => Promise<T | null>,
  logError: (msg: string) => void,
): Promise<LLMOrgContext[]> {
  const orgCodes = ["DEVOPSCORNER", "TELEMETRYFLOW"];

  const encryptionKey =
    process.env.LLM_ENCRYPTION_KEY ||
    "c2e99d6434149387ca145ac0fd61c3b107edf22e4c8c8388864d3c953bb0bff6";

  const contexts: LLMOrgContext[] = [];

  for (const code of orgCodes) {
    const organization = await findRecord<{ organization_id: string }>(
      dataSource,
      "organizations",
      { code },
    );
    if (!organization) {
      logError(`Organization ${code} not found, skipping LLM seeds.`);
      continue;
    }

    const superAdmin = await findRecord<{ id: string }>(dataSource, "users", {
      email: "superadmin.telemetryflow@telemetryflow.id",
    });
    if (!superAdmin) {
      logError("Super admin user not found. Run DefaultUsersSeed first.");
      continue;
    }

    contexts.push({
      organizationId: organization.organization_id,
      superAdminId: superAdmin.id,
      encryptionKey,
    });
  }

  return contexts;
}

/** Delete conversations + providers for a specific provider_type within an org */
export async function cleanupProviderType(
  dataSource: DataSource,
  organizationId: string,
  providerType: string,
): Promise<void> {
  await dataSource.query(
    `DELETE FROM "llm_conversations"
     WHERE "provider_id" IN (
       SELECT id FROM "llm_providers"
       WHERE "organization_id" = $1 AND "provider_type" = $2
     )`,
    [organizationId, providerType],
  );
  await dataSource.query(
    `DELETE FROM "llm_providers"
     WHERE "organization_id" = $1 AND "provider_type" = $2`,
    [organizationId, providerType],
  );
}

/** Insert a batch of LLM provider rows */
export async function insertProviders(
  dataSource: DataSource,
  ctx: LLMOrgContext,
  providers: LLMProviderData[],
): Promise<number> {
  let inserted = 0;
  for (const provider of providers) {
    const encryptedKey = encryptApiKey(
      provider.api_key_placeholder,
      ctx.encryptionKey,
    );
    const hint =
      provider.api_key_placeholder.substring(0, 5) +
      "..." +
      provider.api_key_placeholder.slice(-4);

    await dataSource.query(
      `INSERT INTO "llm_providers"
        (id, organization_id, name, provider_type, encrypted_api_key, api_key_hint,
         base_url, model_id, model_config, is_default, is_active, usage_count, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13)`,
      [
        randomUUID(),
        ctx.organizationId,
        provider.name,
        provider.provider_type,
        encryptedKey,
        hint,
        provider.base_url,
        provider.model_id,
        provider.model_config,
        provider.is_default,
        provider.is_active,
        0,
        ctx.superAdminId,
      ],
    );
    inserted++;
  }
  return inserted;
}
