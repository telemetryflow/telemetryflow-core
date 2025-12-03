# Environment Variables Updates

## Added Grafana Configuration

### New Section: GRAFANA CONFIGURATION
```bash
# Grafana Admin Credentials
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=admin
```

### Updated: Service Versions
```bash
GRAFANA_VERSION=latest
```

### Updated: Container Names
```bash
CONTAINER_GRAFANA=telemetryflow_core_grafana
```

### Updated: Port Mappings
```bash
PORT_GRAFANA=3001
```

### Updated: Static IP Addresses
```bash
CONTAINER_IP_GRAFANA=172.151.151.70
```

### Updated: Services List
Added Grafana to docker-compose services documentation:
- grafana: SPM dashboards & visualization

## Usage

1. Copy to .env:
```bash
cp .env.example .env
```

2. Update credentials for production:
```bash
GF_SECURITY_ADMIN_USER=your_admin_user
GF_SECURITY_ADMIN_PASSWORD=your_secure_password
```

3. Start services:
```bash
docker-compose up -d
```

4. Access Grafana:
```
http://localhost:3001
```

## Security Notes

🔒 **Production**: Change default Grafana credentials
- Default: admin/admin (development only)
- Production: Use strong passwords
- Consider enabling OAuth/LDAP authentication

## Related Documentation

- `docs/SPM_SETUP_GUIDE.md` - Complete SPM setup
- `docs/SPM_STATUS.md` - Current SPM status
- `config/grafana/provisioning/` - Grafana configuration
