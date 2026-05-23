import { MaskingRuleProps } from "../../domain/value-objects/MaskingRule";

export class CreatePolicyCommand {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly rules: MaskingRuleProps[],
    public readonly createdBy: string,
    public readonly description?: string,
    public readonly workspaceId?: string,
    public readonly enabled: boolean = true,
  ) {}
}
