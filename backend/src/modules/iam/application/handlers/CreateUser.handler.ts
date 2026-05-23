import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, ConflictException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { CreateUserCommand } from '../commands/CreateUser.command';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { User } from '../../domain/aggregates/User';
import { Email } from '../../domain/value-objects/Email';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleId } from '../../domain/value-objects/RoleId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';
import { TenantId } from '../../domain/value-objects/TenantId';

export interface CreateUserResult {
  userId: string;
  emailVerificationRequired: boolean;
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IUserRoleRepository')
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: IOrganizationRepository,
    @Inject('IWorkspaceRepository')
    private readonly workspaceRepository: IWorkspaceRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    // 1. Validate email uniqueness
    const email = Email.create(command.email);
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Validate organization (if provided)
    if (command.organizationId) {
      const org = await this.organizationRepository.findById(
        OrganizationId.create(command.organizationId),
      );
      if (!org) {
        throw new BadRequestException('Organization not found');
      }
    }

    // 3. Validate workspace belongs to organization (if provided)
    if (command.workspaceId) {
      const workspace = await this.workspaceRepository.findById(
        WorkspaceId.create(command.workspaceId),
      );
      if (!workspace) {
        throw new BadRequestException('Workspace not found');
      }
      if (
        command.organizationId &&
        workspace.organizationId.getValue() !== command.organizationId
      ) {
        throw new BadRequestException(
          'Workspace does not belong to the specified organization',
        );
      }
    }

    // 4. Validate tenant belongs to workspace (if provided)
    if (command.tenantId) {
      const tenant = await this.tenantRepository.findById(
        TenantId.create(command.tenantId),
      );
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }
      if (
        command.workspaceId &&
        tenant.getWorkspaceId().getValue() !== command.workspaceId
      ) {
        throw new BadRequestException(
          'Tenant does not belong to the specified workspace',
        );
      }
    }

    // 5. Hash password
    const passwordHash = await argon2.hash(command.password);

    // 6. Create user aggregate
    const user = User.create(
      email,
      passwordHash,
      command.firstName,
      command.lastName,
      command.tenantId || null,
      command.organizationId || null,
    );

    if (command.forcePasswordChange) {
      user.requirePasswordChange();
    }

    // 7. Persist
    await this.userRepository.save(user);
    const userId = user.getId().getValue();

    // 8. Assign role — use provided roleId or fall back to "Viewer"
    const role = command.roleId
      ? await this.roleRepository.findById(RoleId.create(command.roleId))
      : await this.roleRepository.findByName('Viewer');

    if (role) {
      await this.userRoleRepository.assignRole(
        UserId.create(userId),
        RoleId.create(role.getId().getValue()),
      );
    }

    // 9. Publish domain events
    user.domainEvents.forEach((event) => this.eventBus.publish(event));

    return { userId, emailVerificationRequired: command.sendEmailVerification };
  }
}
