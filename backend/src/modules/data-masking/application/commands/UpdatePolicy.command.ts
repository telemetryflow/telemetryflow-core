import { MaskingRuleProps } from "../../domain/value-objects/MaskingRule";

export class UpdatePolicyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly updatedBy: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly rules?: MaskingRuleProps[],
    public readonly enabled?: boolean,
  ) {}
}
