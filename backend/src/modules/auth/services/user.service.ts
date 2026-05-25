import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { User } from "../../iam/domain/aggregates/User";
import { Email } from "../../iam/domain/value-objects/Email";
import { UserMapper } from "../../iam/infrastructure/persistence/UserMapper";

/**
 * UserService - Core user management service for authentication
 *
 * Responsibilities:
 * - User CRUD operations
 * - Password hashing using bcrypt with cost factor 12
 * - Password complexity validation
 * - Email uniqueness validation
 *
 * Requirements: 3.1, 3.8, 10.10
 */
@Injectable()
export class UserService {
  // Password complexity requirements
  private readonly PASSWORD_MIN_LENGTH = 8;
  private readonly PASSWORD_MAX_LENGTH = 100;
  private readonly BCRYPT_COST_FACTOR = 12;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new user with hashed password
   * Validates email uniqueness and password complexity
   *
   * @param email - User email address
   * @param password - Plain text password
   * @param firstName - User first name
   * @param lastName - User last name
   * @param tenantId - Optional tenant ID
   * @param organizationId - Optional organization ID
   * @returns Created User domain object
   * @throws ConflictException if email already exists
   * @throws BadRequestException if password doesn't meet complexity requirements
   */
  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantId?: string,
    organizationId?: string,
  ): Promise<User> {
    // Validate email uniqueness
    await this.validateEmailUniqueness(email);

    // Validate password complexity
    this.validatePasswordComplexity(password);

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create domain objects
    const emailVO = Email.create(email);

    // Create user aggregate
    const user = User.create(
      emailVO,
      passwordHash,
      firstName,
      lastName,
      tenantId || null,
      organizationId || null,
    );

    // Persist to database
    const entity = UserMapper.toEntity(user);
    await this.userRepository.save(entity);

    return user;
  }

  /**
   * Find user by ID
   *
   * @param userId - User ID
   * @returns User domain object or null if not found
   */
  async findById(userId: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({
      where: { id: userId },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  /**
   * Find user by email
   *
   * @param email - User email address
   * @returns User domain object or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({
      where: { email },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  /**
   * Update user
   *
   * @param user - User domain object
   */
  async updateUser(user: User): Promise<void> {
    const entity = UserMapper.toEntity(user);
    await this.userRepository.save(entity);
  }

  /**
   * Delete user (soft delete)
   *
   * @param userId - User ID
   */
  async deleteUser(userId: string): Promise<void> {
    await this.userRepository.softDelete(userId);
  }

  /**
   * Hash password using bcrypt with cost factor 12
   * Requirement: 10.10
   *
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_COST_FACTOR);
  }

  /**
   * Verify password against hash
   *
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns True if password matches hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password complexity requirements
   * Requirements: 3.8, 4.5
   *
   * Rules:
   * - Minimum 8 characters
   * - Maximum 100 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   *
   * @param password - Plain text password
   * @throws BadRequestException if password doesn't meet requirements
   */
  validatePasswordComplexity(password: string): void {
    const errors: string[] = [];

    // Check length
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      errors.push(
        `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`,
      );
    }

    if (password.length > this.PASSWORD_MAX_LENGTH) {
      errors.push(
        `Password must not exceed ${this.PASSWORD_MAX_LENGTH} characters`,
      );
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: "Password does not meet complexity requirements",
        errors: errors,
      });
    }
  }

  /**
   * Validate email uniqueness
   * Requirement: 3.4
   *
   * @param email - Email address to validate
   * @throws ConflictException if email already exists
   */
  async validateEmailUniqueness(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email address is already registered");
    }
  }

  /**
   * Update user password with validation
   *
   * @param userId - User ID
   * @param newPassword - New plain text password
   * @throws NotFoundException if user not found
   * @throws BadRequestException if password doesn't meet complexity requirements
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Validate password complexity
    this.validatePasswordComplexity(newPassword);

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user password
    user.changePassword(passwordHash);

    // Persist changes
    await this.updateUser(user);
  }
}
