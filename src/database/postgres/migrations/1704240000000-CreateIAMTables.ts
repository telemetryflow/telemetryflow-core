import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIAMTables1704240000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Creating IAM tables...');
    
    // Enable UUID extension
    console.log('   ✓ Enabling UUID extension');
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Regions
    console.log('   ✓ Creating regions table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS regions (
        region_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP
      )
    `);

    // Organizations
    console.log('   ✓ Creating organizations table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    // Workspaces
    console.log('   ✓ Creating workspaces table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        organization_id UUID NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS IDX_workspaces_organization ON workspaces(organization_id);
    `);

    // Tenants
    console.log('   ✓ Creating tenants table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        organization_id UUID NOT NULL,
        workspace_id UUID NOT NULL,
        region_id UUID NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS IDX_tenants_org_workspace ON tenants(organization_id, workspace_id);
    `);

    // Users
    console.log('   ✓ Creating users table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        avatar VARCHAR(500),
        timezone VARCHAR(50),
        locale VARCHAR(10),
        mfa_enabled BOOLEAN DEFAULT false,
        mfa_secret VARCHAR(255),
        mfa_backup_codes JSONB,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS IDX_users_email_deleted ON users(email, deleted_at);
    `);

    // Roles
    console.log('   ✓ Creating roles table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        permissions JSONB DEFAULT '[]',
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Permissions
    console.log('   ✓ Creating permissions table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Groups
    console.log('   ✓ Creating groups table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        organization_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS IDX_groups_organization ON groups(organization_id);
    `);

    // User Roles
    console.log('   ✓ Creating user_roles table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        role_id VARCHAR(100) NOT NULL,
        tenant_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT FK_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_user_roles_unique ON user_roles(user_id, role_id);
    `);

    // User Permissions
    console.log('   ✓ Creating user_permissions table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        permission_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT FK_user_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_user_permissions_unique ON user_permissions(user_id, permission_id);
    `);

    // Role Permissions
    console.log('   ✓ Creating role_permissions table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role_id VARCHAR(100) NOT NULL,
        permission_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT FK_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_role_permissions_unique ON role_permissions(role_id, permission_id);
    `);

    // User Groups
    console.log('   ✓ Creating user_groups table');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        group_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_user_groups_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT FK_user_groups_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_user_groups_unique ON user_groups(user_id, group_id);
    `);
    
    console.log('   ✅ IAM tables created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🗑️  Dropping IAM tables...');
    
    await queryRunner.query(`DROP TABLE IF EXISTS user_groups CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS groups CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenants CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS workspaces CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS regions CASCADE`);
    
    console.log('   ✅ IAM tables dropped successfully');
  }
}
