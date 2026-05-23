import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { TestMaskingRuleCommand } from "../commands/TestMaskingRule.command";
import { MaskingRule } from "../../domain/value-objects/MaskingRule";
import { TestRuleResponseDto } from "../dto/PolicyResponse.dto";

@CommandHandler(TestMaskingRuleCommand)
export class TestMaskingRuleHandler implements ICommandHandler<TestMaskingRuleCommand> {
  async execute(command: TestMaskingRuleCommand): Promise<TestRuleResponseDto> {
    const rule = new MaskingRule({
      ...command.rule,
      id: command.rule.id ?? "test",
      enabled: true,
    });
    const masked = rule.apply(command.sampleInput);

    // Count approximate matches by comparing before/after
    const matchCount =
      command.sampleInput !== masked
        ? command.sampleInput.split(masked.split("[REDACTED]")[0] || "")
            .length - 1 || 1
        : 0;

    return {
      original: command.sampleInput,
      masked,
      changed: command.sampleInput !== masked,
      matchCount,
    };
  }
}
