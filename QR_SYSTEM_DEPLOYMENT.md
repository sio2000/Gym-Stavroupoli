# QR System Deployment Guide
## Feature Flag: FEATURE_QR_SYSTEM

### Overview
This guide provides step-by-step instructions for safely deploying the QR entrance/exit system to production.

---

## 🚨 PRE-DEPLOYMENT CHECKLIST

### 1. Database Backup
```bash
# Create full database backup
pg_dump -h your-host -U your-user -d your-db > backup_before_qr_system_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -la backup_before_qr_system_*.sql
```

### 2. Staging Environment Testing
```bash
# 1. Deploy to staging
git checkout main
git pull origin main
npm install
npm run build

# 2. Run migrations on staging
psql -h staging-host -U staging-user -d staging-db -f database/QR_SYSTEM_MIGRATIONS.sql

# 3. Run tests
npm test -- --testPathPattern=qrSystem

# 4. Manual testing
# - Test QR code generation
# - Test QR code validation
# - Test secretary dashboard
# - Test feature flag toggle
```

### 3. Environment Variables
```bash
# Add to .env.production
QR_SECRET_KEY=your_secure_secret_key_here_minimum_32_characters
FEATURE_QR_SYSTEM=false
```

---

## 📋 DEPLOYMENT STEPS

### Phase 1: Database Migration
```bash
# 1. Connect to production database
psql -h production-host -U production-user -d production-db

# 2. Run migration script
\i database/QR_SYSTEM_MIGRATIONS.sql

# 3. Verify migration
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'secretaries', 'scan_audit_logs', 'feature_flags');

# 4. Check feature flag
SELECT * FROM feature_flags WHERE name = 'FEATURE_QR_SYSTEM';
```

### Phase 2: Application Deployment
```bash
# 1. Deploy application code
git checkout main
git pull origin main
npm install
npm run build

# 2. Deploy to production server
# (Your deployment process here)

# 3. Verify deployment
curl -f https://your-domain.com/api/health
```

### Phase 3: Feature Activation
```bash
# 1. Enable feature flag
psql -h production-host -U production-user -d production-db -c "
UPDATE feature_flags 
SET is_enabled = true, updated_at = NOW() 
WHERE name = 'FEATURE_QR_SYSTEM';
"

# 2. Verify feature is enabled
psql -h production-host -U production-user -d production-db -c "
SELECT name, is_enabled FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';
"
```

### Phase 4: Post-Deployment Verification
```bash
# 1. Test QR code generation
curl -X POST https://your-domain.com/api/qr/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"userId": "test-user-id", "category": "free_gym"}'

# 2. Test QR code validation
curl -X GET "https://your-domain.com/api/qr/validate?qrData=test&scanType=entrance" \
  -H "Authorization: Bearer SECRETARY_TOKEN"

# 3. Check application logs
tail -f /var/log/your-app/qr-system.log
```

---

## 🔄 ROLLBACK PROCEDURE

### Emergency Rollback (if issues occur)
```bash
# 1. Disable feature flag immediately
psql -h production-host -U production-user -d production-db -c "
UPDATE feature_flags 
SET is_enabled = false, updated_at = NOW() 
WHERE name = 'FEATURE_QR_SYSTEM';
"

# 2. Verify feature is disabled
psql -h production-host -U production-user -d production-db -c "
SELECT name, is_enabled FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';
"
```

### Full Rollback (if needed)
```bash
# 1. Disable feature flag
psql -h production-host -U production-user -d production-db -c "
UPDATE feature_flags 
SET is_enabled = false, updated_at = NOW() 
WHERE name = 'FEATURE_QR_SYSTEM';
"

# 2. Run rollback script
psql -h production-host -U production-user -d production-db -f database/QR_SYSTEM_ROLLBACK.sql

# 3. Verify rollback
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'secretaries', 'scan_audit_logs');

# Should return empty result

# 4. Restore from backup if needed
# psql -h production-host -U production-user -d production-db < backup_before_qr_system_YYYYMMDD_HHMMSS.sql
```

---

## 🧪 TESTING COMMANDS

### Run Unit Tests
```bash
npm test -- --testPathPattern=qrSystem
```

### Run Integration Tests
```bash
npm run test:integration -- --testPathPattern=qr
```

### Run E2E Tests
```bash
npm run test:e2e -- --spec="**/qr-scanner.spec.ts"
```

### Manual Testing Checklist
- [ ] QR code generation works
- [ ] QR code validation works
- [ ] Secretary dashboard loads
- [ ] Camera access works
- [ ] Audit logs are created
- [ ] Feature flag toggle works
- [ ] Existing functionality unaffected

---

## 📊 MONITORING

### Key Metrics to Monitor
1. **QR Code Generation Rate**
   ```sql
   SELECT COUNT(*) as qr_codes_generated 
   FROM qr_codes 
   WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

2. **Scan Success Rate**
   ```sql
   SELECT 
     COUNT(*) as total_scans,
     SUM(CASE WHEN result = 'approved' THEN 1 ELSE 0 END) as successful_scans,
     ROUND(SUM(CASE WHEN result = 'approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
   FROM scan_audit_logs 
   WHERE scanned_at > NOW() - INTERVAL '1 hour';
   ```

3. **Error Rate**
   ```sql
   SELECT 
     reason,
     COUNT(*) as error_count
   FROM scan_audit_logs 
   WHERE result = 'rejected' 
   AND scanned_at > NOW() - INTERVAL '1 hour'
   GROUP BY reason
   ORDER BY error_count DESC;
   ```

### Log Monitoring
```bash
# Monitor QR system logs
tail -f /var/log/your-app/qr-system.log | grep -E "(ERROR|WARN)"

# Monitor scan attempts
tail -f /var/log/your-app/qr-system.log | grep "scan_attempt"
```

---

## 🔒 SECURITY CONSIDERATIONS

### Production Security Checklist
- [ ] QR_SECRET_KEY is properly set and secure (32+ characters)
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Input validation is working
- [ ] Audit logs are being written
- [ ] No sensitive data in logs
- [ ] Secretary accounts are properly secured

### Security Hardening (Future)
1. **Token Rotation**: Implement periodic QR token rotation
2. **Nonce System**: Add nonce to prevent replay attacks
3. **Rate Limiting**: Implement per-user rate limiting
4. **IP Whitelisting**: Restrict secretary access to specific IPs
5. **Audit Log Retention**: Implement log retention policies

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues
1. **QR codes not generating**
   - Check feature flag status
   - Verify database permissions
   - Check application logs

2. **Scanner not working**
   - Verify camera permissions
   - Check browser compatibility
   - Test with manual QR input

3. **Validation failing**
   - Check QR token format
   - Verify database connectivity
   - Check rate limiting

### Emergency Contacts
- **Database Issues**: DBA Team
- **Application Issues**: DevOps Team
- **Security Issues**: Security Team

---

## 📈 PERFORMANCE OPTIMIZATION

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_qr_codes_user_status ON qr_codes(user_id, status);
CREATE INDEX CONCURRENTLY idx_scan_audit_scanned_at ON scan_audit_logs(scanned_at DESC);
```

### Application Optimization
- Implement QR code caching
- Add database connection pooling
- Optimize QR image generation
- Implement background job processing

---

## 📝 POST-DEPLOYMENT TASKS

### Immediate (0-24 hours)
- [ ] Monitor error rates
- [ ] Check scan success rates
- [ ] Verify audit logs
- [ ] Test all user flows

### Short-term (1-7 days)
- [ ] Analyze usage patterns
- [ ] Optimize performance
- [ ] Gather user feedback
- [ ] Update documentation

### Long-term (1-4 weeks)
- [ ] Implement additional features
- [ ] Security hardening
- [ ] Performance optimization
- [ ] User training

---

## 🎯 SUCCESS CRITERIA

### Technical Success
- [ ] All tests pass
- [ ] No database errors
- [ ] Scan success rate > 95%
- [ ] Response time < 500ms
- [ ] Zero security incidents

### Business Success
- [ ] Users can generate QR codes
- [ ] Secretaries can scan QR codes
- [ ] Audit trail is complete
- [ ] System is stable
- [ ] User satisfaction is high

---

## 📋 MAINTENANCE SCHEDULE

### Daily
- Monitor error rates
- Check scan success rates
- Review audit logs

### Weekly
- Analyze usage patterns
- Review security logs
- Performance optimization

### Monthly
- Update documentation
- Security review
- Feature enhancement planning

---

*Last Updated: [Current Date]*
*Version: 1.0.0*
*Status: Ready for Production*
