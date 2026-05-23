import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { MaskingRuleDto } from "./CreatePolicy.dto";

export class UpdatePolicyDto {
  @ApiPropertyOptional({ description: "New policy name" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: "New policy description (null to clear)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: "Enable or disable the policy" })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    type: [MaskingRuleDto],
    description: "Full replacement rule list (replaces all existing rules)",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaskingRuleDto)
  rules?: MaskingRuleDto[];
}
