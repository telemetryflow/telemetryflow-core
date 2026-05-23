import { MaskingRuleProps } from "../../domain/value-objects/MaskingRule";

export class TestMaskingRuleCommand {
  constructor(
    public readonly rule: MaskingRuleProps,
    public readonly sampleInput: string,
  ) {}
}
