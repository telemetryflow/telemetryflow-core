import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ResolveAlertRequestDto {
  @ApiPropertyOptional({
    description: "Resolution notes explaining how the alert was resolved",
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}
