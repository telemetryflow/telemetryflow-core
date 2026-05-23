import { v4 as uuidv4 } from "uuid";

export class AlertRuleId {
  private constructor(private readonly value: string) {}

  static generate(): AlertRuleId {
    return new AlertRuleId(uuidv4());
  }

  static fromString(value: string): AlertRuleId {
    if (!value || typeof value !== "string") {
      throw new Error("Invalid AlertRuleId");
    }
    return new AlertRuleId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AlertRuleId): boolean {
    return this.value === other.value;
  }
}
