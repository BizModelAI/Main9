# Data Retention Policy

## Overview

BizModelAI implements a tiered data retention policy based on user payment status to balance user privacy with business needs.

## Retention Periods

### Paid Users (Logged-in with payment)

- **Retention**: Permanent
- **Data**: All quiz data, AI insights, and user information stored indefinitely
- **Reason**: Paid users expect persistent access to their purchased content

### Unpaid Users with Email

- **Retention**: 3 months (90 days)
- **Data**: Quiz data, preview AI insights, and basic user information
- **Expiration**: Automatic deletion after 3 months unless user upgrades to paid
- **Notice**: Users are informed via email about the 3-month retention period

### Unpaid Users without Email

- **Retention**: Session only
- **Data**: No persistent storage in database
- **Expiration**: Data cleared when browser session ends

## Implementation Details

### Database Schema

- `users.expires_at`: Expiration timestamp for temporary users (3 months)
- `quiz_attempts.expires_at`: Expiration timestamp for unpaid user quiz attempts (3 months)
- Paid users have `expires_at` set to `NULL` (no expiration)

### Automatic Cleanup

- **Script**: `scripts/cleanup-expired-data.ts`
- **Frequency**: Should be run daily via cron job
- **Action**: Deletes expired users and quiz attempts
- **Logging**: Detailed logs for audit purposes

### User Upgrade Process

When an unpaid user upgrades to paid:

1. `users.is_paid` set to `true`
2. `users.is_temporary` set to `false`
3. `users.expires_at` set to `NULL` (permanent)
4. All associated `quiz_attempts.expires_at` set to `NULL` (permanent)

## Email Notifications

### Preview Email Disclaimer

All preview emails sent to unpaid users include:

- Clear notice about 3-month data retention
- Information about permanent storage with paid upgrade
- Link to upgrade for permanent access

### Email Content

```
📅 Data Retention Notice:
Your quiz results and data will be stored securely for 3 months from today.
After this period, your data will be automatically deleted from our systems
unless you create a paid account.

Want to keep your results forever? Upgrade to unlock your full report and
your data will be saved permanently.
```

## Scripts and Maintenance

### Available Scripts

```bash
# Run data cleanup (removes expired data)
npm run cleanup-expired-data

# Add expiration column to existing quiz attempts (one-time migration)
npm run add-quiz-attempt-expiration
```

### Recommended Cron Schedule

```bash
# Run cleanup daily at 2 AM
0 2 * * * cd /path/to/app && npm run cleanup-expired-data >> /var/log/bizmodelai-cleanup.log 2>&1
```

## Privacy Compliance

### GDPR Compliance

- Users are informed about data retention periods
- Automatic deletion ensures data minimization
- Users can request immediate deletion by not providing email

### Transparency

- Retention periods clearly communicated to users
- Upgrade options provided for permanent storage
- Audit logs maintained for all deletions

## Monitoring

### Metrics to Track

- Number of users approaching expiration (7-day warning)
- Daily cleanup statistics
- Conversion rate from temporary to paid users
- Storage savings from data retention policy

### Alerts

- Monitor cleanup script failures
- Alert when large numbers of users are about to expire
- Track unusual patterns in data retention

## Technical Notes

### Database Indexes

Consider adding indexes for cleanup performance:

```sql
CREATE INDEX idx_users_expires_at ON users(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_quiz_attempts_expires_at ON quiz_attempts(expires_at) WHERE expires_at IS NOT NULL;
```

### Backup Considerations

- Expired data should be excluded from regular backups
- Consider archival backup for compliance purposes
- Test restore procedures with expiration logic

## Support and Questions

For questions about data retention:

- Technical: Check `scripts/cleanup-expired-data.ts` for implementation details
- Policy: Refer to privacy policy and terms of service
- Monitoring: Check cleanup logs in `/var/log/bizmodelai-cleanup.log`
