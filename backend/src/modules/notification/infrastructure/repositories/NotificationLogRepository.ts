import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationLogEntity } from "../entities/NotificationLog.entity";

@Injectable()
export class NotificationLogRepository {
  constructor(
    @InjectRepository(NotificationLogEntity)
    private readonly repository: Repository<NotificationLogEntity>,
  ) {}

  async findById(id: string): Promise<NotificationLogEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganizationId(
    organizationId: string,
    options: {
      page?: number;
      pageSize?: number;
      type?: string;
      status?: string;
    } = {},
  ): Promise<{ items: NotificationLogEntity[]; total: number }> {
    const { page = 1, pageSize = 20, type, status } = options;

    const queryBuilder = this.repository
      .createQueryBuilder("log")
      .where("log.organization_id = :organizationId", { organizationId });

    if (type) {
      queryBuilder.andWhere("log.type = :type", { type });
    }

    if (status) {
      queryBuilder.andWhere("log.status = :status", { status });
    }

    const [items, total] = await queryBuilder
      .orderBy("log.created_at", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total };
  }

  async findByStatus(
    status: string,
    limit = 100,
  ): Promise<NotificationLogEntity[]> {
    return this.repository.find({
      where: { status },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }

  async create(
    data: Partial<NotificationLogEntity>,
  ): Promise<NotificationLogEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async updateStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: Partial<NotificationLogEntity> = { status };

    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    if (status === "sent") {
      updateData.sentAt = new Date();
    }

    if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    await this.repository.update(id, updateData);
  }
}
