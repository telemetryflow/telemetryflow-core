import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationChannelEntity } from "../entities/NotificationChannel.entity";

@Injectable()
export class NotificationChannelRepository {
  constructor(
    @InjectRepository(NotificationChannelEntity)
    private readonly repository: Repository<NotificationChannelEntity>,
  ) {}

  async findById(id: string): Promise<NotificationChannelEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganizationId(
    organizationId: string,
    options: { enabled?: boolean } = {},
  ): Promise<NotificationChannelEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder("channel")
      .where("channel.organization_id = :organizationId", { organizationId });

    if (options.enabled !== undefined) {
      queryBuilder.andWhere("channel.enabled = :enabled", {
        enabled: options.enabled,
      });
    }

    return queryBuilder.orderBy("channel.name", "ASC").getMany();
  }

  async findByType(
    organizationId: string,
    type: string,
  ): Promise<NotificationChannelEntity[]> {
    return this.repository.find({
      where: { organizationId, type },
      order: { name: "ASC" },
    });
  }

  async create(
    data: Partial<NotificationChannelEntity>,
  ): Promise<NotificationChannelEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: Partial<NotificationChannelEntity>,
  ): Promise<void> {
    await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateVerified(
    id: string,
    verified: boolean,
    lastTestedAt?: Date,
  ): Promise<void> {
    const updateData: Partial<NotificationChannelEntity> = { verified };

    if (lastTestedAt) {
      updateData.lastTestedAt = lastTestedAt;
    }

    await this.repository.update(id, updateData);
  }
}
