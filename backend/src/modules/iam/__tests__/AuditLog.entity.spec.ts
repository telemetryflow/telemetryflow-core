import { AuditLogEntity } from '../infrastructure/persistence/entities/AuditLog.entity';

describe('AuditLogEntity', () => {
  it('should create an audit log entity', () => {
    const auditLog = new AuditLogEntity();
    auditLog.id = 'log-123';
    auditLog.action = 'CREATE';
    auditLog.resource_type = 'User';
    auditLog.resource_id = 'user-123';
    auditLog.user_id = 'admin-123';
    auditLog.created_at = new Date();

    expect(auditLog.id).toBe('log-123');
    expect(auditLog.action).toBe('CREATE');
    expect(auditLog.resource_type).toBe('User');
  });

  it('should have correct property types', () => {
    const auditLog = new AuditLogEntity();
    auditLog.id = 'log-123';
    auditLog.action = 'UPDATE';
    auditLog.created_at = new Date();

    expect(typeof auditLog.id).toBe('string');
    expect(typeof auditLog.action).toBe('string');
    expect(auditLog.created_at).toBeInstanceOf(Date);
  });
});
