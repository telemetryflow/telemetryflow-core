/**
 * API Key Encryption Service
 * Handles encryption/decryption of per-key encryption keys using AES-256-GCM
 * Uses the platform ENCRYPTION_KEY to encrypt each API key's individual encrypt_key
 */

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class ApiKeyEncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>("ENCRYPTION_KEY");
    if (!key || key.length < 32) {
      throw new Error(
        "ENCRYPTION_KEY must be at least 32 characters. " +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }
    // Derive a consistent 32-byte key using SHA-256
    this.encryptionKey = crypto.createHash("sha256").update(key).digest();
  }

  /**
   * Encrypt a per-key encryption key
   * Returns base64-encoded string: IV + AuthTag + Ciphertext
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]).toString(
      "base64",
    );
  }

  /**
   * Decrypt a per-key encryption key
   * Input: base64-encoded string from encrypt()
   */
  decrypt(ciphertext: string): string {
    const buffer = Buffer.from(ciphertext, "base64");

    if (buffer.length < this.ivLength + this.tagLength + 1) {
      throw new Error("Invalid ciphertext: too short");
    }

    const iv = buffer.subarray(0, this.ivLength);
    const authTag = buffer.subarray(
      this.ivLength,
      this.ivLength + this.tagLength,
    );
    const encrypted = buffer.subarray(this.ivLength + this.tagLength);

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }
}

export const API_KEY_ENCRYPTION_SERVICE = Symbol("API_KEY_ENCRYPTION_SERVICE");
