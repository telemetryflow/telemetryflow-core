import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { NotificationTemplateEntity } from "../entities/NotificationTemplate.entity";

@Injectable()
export class NotificationTemplateRepository {
  constructor(
    @InjectRepository(NotificationTemplateEntity)
    private readonly repository: Repository<NotificationTemplateEntity>,
  ) {}

  async findById(id: string): Promise<NotificationTemplateEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(
    name: string,
    organizationId?: string,
  ): Promise<NotificationTemplateEntity | null> {
    if (organizationId) {
      return this.repository.findOne({
        where: { name, organizationId },
      });
    }

    // Look for system template (no organization)
    return this.repository.findOne({
      where: { name, organizationId: IsNull() },
    });
  }

  async findByOrganizationId(
    organizationId: string,
    options: { type?: string; enabled?: boolean } = {},
  ): Promise<NotificationTemplateEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder("template")
      .where(
        "(template.organization_id = :organizationId OR template.organization_id IS NULL)",
        { organizationId },
      );

    if (options.type) {
      queryBuilder.andWhere("template.type = :type", { type: options.type });
    }

    if (options.enabled !== undefined) {
      queryBuilder.andWhere("template.enabled = :enabled", {
        enabled: options.enabled,
      });
    }

    return queryBuilder.orderBy("template.name", "ASC").getMany();
  }

  async findSystemTemplates(): Promise<NotificationTemplateEntity[]> {
    return this.repository.find({
      where: { isSystem: true },
      order: { name: "ASC" },
    });
  }

  async create(
    data: Partial<NotificationTemplateEntity>,
  ): Promise<NotificationTemplateEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: Partial<NotificationTemplateEntity>,
  ): Promise<void> {
    await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
