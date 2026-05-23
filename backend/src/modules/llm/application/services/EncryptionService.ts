/**
 * LLM Encryption Service
 * Handles encryption/decryption of LLM API keys using AES-256-GCM
 */

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class LLMEncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>("LLM_ENCRYPTION_KEY");
    if (!key || key.length < 32) {
      throw new Error(
        "LLM_ENCRYPTION_KEY must be at least 32 characters. " +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
      );
    }
    // Derive a consistent 32-byte key using SHA-256
    this.encryptionKey = crypto.createHash("sha256").update(key).digest();
  }

  /**
   * Encrypt a plaintext API key
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

    // Combine: IV (16 bytes) + AuthTag (16 bytes) + Encrypted data
    return Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]).toString(
      "base64",
    );
  }

  /**
   * Decrypt an encrypted API key
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

  /**
   * Generate a hint for displaying masked API key
   * Example: "sk-...abc123"
   */
  generateKeyHint(apiKey: string): string {
    if (!apiKey || apiKey.length <= 10) {
      return "***";
    }
    const prefix = apiKey.substring(0, 5);
    const suffix = apiKey.substring(apiKey.length - 4);
    return `${prefix}...${suffix}`;
  }

  /**
   * Validate that a string looks like an encrypted key
   */
  isValidEncryptedFormat(value: string): boolean {
    try {
      const buffer = Buffer.from(value, "base64");
      return buffer.length >= this.ivLength + this.tagLength + 1;
    } catch {
      return false;
    }
  }
}
