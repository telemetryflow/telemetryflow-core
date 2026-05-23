import { ApiProperty } from "@nestjs/swagger";

export class RoleResponseDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "Admin" })
  name: string;

  @ApiProperty({ example: "Administrator role with full access" })
  description: string;

  @ApiProperty({ description: "Permission objects (id, name, resource, action) or permission name strings", type: [Object] })
  permissions: any[];

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  tenantId?: string;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ example: "2026-02-27T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-02-27T10:00:00Z" })
  updatedAt: Date;
}
