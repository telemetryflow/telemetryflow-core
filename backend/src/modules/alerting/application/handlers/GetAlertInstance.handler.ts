import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { GetAlertInstanceQuery } from "../queries";
import { AlertInstanceResponseDto } from "../dto";
import {
  ALERT_INSTANCE_REPOSITORY,
  IAlertInstanceRepository,
} from "../../domain";

@QueryHandler(GetAlertInstanceQuery)
export class GetAlertInstanceHandler implements IQueryHandler<GetAlertInstanceQuery> {
  constructor(
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
  ) {}

  async execute(
    query: GetAlertInstanceQuery,
  ): Promise<AlertInstanceResponseDto> {
    const alertInstance = await this.alertInstanceRepository.findById(query.id);

    if (!alertInstance) {
      throw new NotFoundException("Alert instance not found");
    }

    if (alertInstance.getOrganizationId() !== query.organizationId) {
      throw new ForbiddenException("Access denied");
    }

    return AlertInstanceResponseDto.fromDomain(alertInstance);
  }
}
