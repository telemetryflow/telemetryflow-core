-- Create role_permissions junction table
-- This table links roles to permissions for RBAC

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Add comment
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to permissions for RBAC system';
