/**
 * Masking Rule Value Object
 *
 * Represents a single PII masking rule within a DataMaskingPolicy.
 * Each rule targets a specific field or pattern and applies a masking
 * transformation before data is persisted to ClickHouse.
 */

export enum TargetField {
  /** The main log body string */
  BODY = "body",
  /** All resource attribute key-value pairs */
  RESOURCE_ATTRIBUTES = "resource_attributes",
  /** All log attribute key-value pairs */
  LOG_ATTRIBUTES = "log_attributes",
  /** A specific key within resource_attributes (requires fieldKey) */
  RESOURCE_ATTRIBUTE_KEY = "resource_attribute_key",
  /** A specific key within log_attributes (requires fieldKey) */
  LOG_ATTRIBUTE_KEY = "log_attribute_key",
  /** All text fields: body + all attribute values */
  ALL = "all",
}

export enum BuiltinPattern {
  EMAIL = "EMAIL",
  CREDIT_CARD = "CREDIT_CARD",
  SSN = "SSN",
  PHONE = "PHONE",
  IP_ADDRESS = "IP_ADDRESS",
  JWT_TOKEN = "JWT_TOKEN",
  API_KEY_GENERIC = "API_KEY_GENERIC",
  URL_CREDENTIALS = "URL_CREDENTIALS",
  AWS_ACCESS_KEY = "AWS_ACCESS_KEY",
  PRIVATE_KEY = "PRIVATE_KEY",
}

export enum MaskType {
  /** Replace entire matched value/field with a fixed string (default: [REDACTED]) */
  REDACT = "REDACT",
  /** Replace matched value with its SHA-256 hash truncated to 16 hex chars */
  HASH = "HASH",
  /** Replace matched portion with a custom replacement string */
  REPLACE = "REPLACE",
  /** Truncate to first N characters followed by ... */
  TRUNCATE = "TRUNCATE",
}

export enum MatchType {
  /** Use one of the built-in PII regex patterns */
  BUILTIN = "builtin",
  /** Use a custom regex pattern provided by the user */
  REGEX = "regex",
  /** Exact string match (case-sensitive) */
  EXACT = "exact",
}

/** Compiled regex patterns for built-in PII types */
export const BUILTIN_PATTERNS: Record<BuiltinPattern, RegExp> = {
  [BuiltinPattern.EMAIL]: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  [BuiltinPattern.CREDIT_CARD]:
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
  [BuiltinPattern.SSN]: /\b\d{3}-\d{2}-\d{4}\b/g,
  [BuiltinPattern.PHONE]:
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  [BuiltinPattern.IP_ADDRESS]:
    /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  [BuiltinPattern.JWT_TOKEN]:
    /eyJ[A-Za-z0-9_-]{2,}\.eyJ[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}/g,
  [BuiltinPattern.API_KEY_GENERIC]:
    /(?:api[_-]?key|apikey|token|secret|password|passwd|pwd)\s*[=:]\s*["']?([A-Za-z0-9_.-]{16,})/gi,
  [BuiltinPattern.URL_CREDENTIALS]: /https?:\/\/[^:@/\s]+:[^@/\s]+@[^\s]+/g,
  [BuiltinPattern.AWS_ACCESS_KEY]:
    /\b(?:AKIA|ASIA|AROA|AIDA|ANPA|ANVA|APKA)[A-Z0-9]{16}\b/g,
  [BuiltinPattern.PRIVATE_KEY]:
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
};

export interface MaskingRuleProps {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  targetField: TargetField;
  /** Required when targetField is RESOURCE_ATTRIBUTE_KEY or LOG_ATTRIBUTE_KEY */
  fieldKey?: string;
  matchType: MatchType;
  builtinPattern?: BuiltinPattern;
  /** User-supplied regex string (used when matchType = REGEX) */
  customPattern?: string;
  maskType: MaskType;
  /** Replacement string for MaskType.REPLACE (default: [REDACTED]) */
  replacement?: string;
  /** Character limit for MaskType.TRUNCATE (default: 4) */
  truncateLength?: number;
}

export class MaskingRule {
  readonly id: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly enabled: boolean;
  readonly priority: number;
  readonly targetField: TargetField;
  readonly fieldKey: string | undefined;
  readonly matchType: MatchType;
  readonly builtinPattern: BuiltinPattern | undefined;
  readonly customPattern: string | undefined;
  readonly maskType: MaskType;
  readonly replacement: string;
  readonly truncateLength: number;

  constructor(props: MaskingRuleProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.enabled = props.enabled;
    this.priority = props.priority;
    this.targetField = props.targetField;
    this.fieldKey = props.fieldKey;
    this.matchType = props.matchType;
    this.builtinPattern = props.builtinPattern;
    this.customPattern = props.customPattern;
    this.maskType = props.maskType;
    this.replacement = props.replacement ?? "[REDACTED]";
    this.truncateLength = props.truncateLength ?? 4;
  }

  /**
   * Apply this rule to a string value.
   * Returns the (potentially modified) string.
   */
  apply(value: string): string {
    if (!this.enabled || !value) return value;

    const pattern = this.buildPattern();
    if (!pattern) return value;

    return value.replace(pattern, (match) => this.mask(match));
  }

  private buildPattern(): RegExp | null {
    switch (this.matchType) {
      case MatchType.BUILTIN:
        if (!this.builtinPattern) return null;
        // Clone with 'g' flag to avoid stateful lastIndex issues
        return new RegExp(
          BUILTIN_PATTERNS[this.builtinPattern].source,
          BUILTIN_PATTERNS[this.builtinPattern].flags.includes("g")
            ? BUILTIN_PATTERNS[this.builtinPattern].flags
            : BUILTIN_PATTERNS[this.builtinPattern].flags + "g",
        );

      case MatchType.REGEX:
        if (!this.customPattern) return null;
        try {
          const safe = this.sanitizeRegex(this.customPattern);
          return new RegExp(safe, "g");
        } catch {
          return null;
        }

      case MatchType.EXACT:
        if (!this.customPattern) return null;
        return new RegExp(
          this.customPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g",
        );

      default:
        return null;
    }
  }

  private mask(matched: string): string {
    switch (this.maskType) {
      case MaskType.REDACT:
        return this.replacement;

      case MaskType.HASH: {
        const crypto = require("crypto");
        return crypto
          .createHash("sha256")
          .update(matched)
          .digest("hex")
          .substring(0, 16);
      }

      case MaskType.REPLACE:
        return this.replacement;

      case MaskType.TRUNCATE:
        return matched.length <= this.truncateLength
          ? matched
          : matched.substring(0, this.truncateLength) + "...";

      default:
        return this.replacement;
    }
  }

  private sanitizeRegex(pattern: string): string {
    const limited = pattern.length > 500 ? pattern.substring(0, 500) : pattern;
    return limited.replace(/\(\?<[!=][^)]*\)/g, "");
  }

  toJSON(): MaskingRuleProps {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      enabled: this.enabled,
      priority: this.priority,
      targetField: this.targetField,
      fieldKey: this.fieldKey,
      matchType: this.matchType,
      builtinPattern: this.builtinPattern,
      customPattern: this.customPattern,
      maskType: this.maskType,
      replacement: this.replacement,
      truncateLength: this.truncateLength,
    };
  }
}
