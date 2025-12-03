import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetTenantQuery } from '../queries/GetTenant.query';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { TenantId } from '../../domain/value-objects/TenantId';
import { TenantResponseDto } from '../dto/TenantResponse.dto';

@QueryHandler(GetTenantQuery)
export class GetTenantHandler implements IQueryHandler<GetTenantQuery> {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}
  async execute(query: GetTenantQuery): Promise<TenantResponseDto> {
    const id = TenantId.create(query.id);
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return {
      id: tenant.getId().getValue(),
      name: tenant.getName(),
      code: tenant.getCode(),
      domain: tenant.getDomain(),
      isActive: tenant.getIsActive(),
      workspaceId: tenant.getWorkspaceId().getValue(),
    };
  }
}
