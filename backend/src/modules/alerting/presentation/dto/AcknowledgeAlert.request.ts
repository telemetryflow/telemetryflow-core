import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class AcknowledgeAlertRequestDto {
  @ApiPropertyOptional({
    description: "Comment explaining the acknowledgement",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
