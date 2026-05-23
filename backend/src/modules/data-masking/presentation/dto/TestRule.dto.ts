import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  MinLength,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { MaskingRuleDto } from "./CreatePolicy.dto";

export class TestRuleDto {
  @ApiProperty({
    description: "The masking rule to test (does not need to be persisted)",
    type: MaskingRuleDto,
  })
  @ValidateNested()
  @Type(() => MaskingRuleDto)
  rule: MaskingRuleDto;

  @ApiProperty({
    description: "Sample log text to apply the rule against",
    example: "User john.doe@example.com logged in from 192.168.1.1",
    maxLength: 10000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  sampleInput: string;
}
