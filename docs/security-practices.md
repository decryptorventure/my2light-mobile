# Security Best Practices

## Environment Variables

### Client-Side Variables

- Use `EXPO_PUBLIC_*` prefix for client-side vars
- Never commit `.env` file to version control
- Use device-specific encryption keys

```env
# .env example
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_ENCRYPTION_KEY=generate_unique_key_per_device
```

### Security Requirements

- ✅ All sensitive keys in `.env`
- ✅ `.env` added to `.gitignore`
- ✅ `.env.example` for reference (no real values)
- ✅ Encryption keys unique per device/environment

## Authentication

### JWT Token Management

- **Storage**: JWT tokens stored in encrypted MMKV
- **Session Expiry**: 1 hour (configurable in Supabase)
- **Auto-Refresh**: Handled by Supabase client
- **Storage Location**: `lib/storage.ts` (MMKV with encryption)

### Row Level Security (RLS)

All database tables must have RLS policies:

```sql
-- Example RLS policy
CREATE POLICY "Users can only see their own data"
ON highlights
FOR SELECT
USING (auth.uid() = user_id);
```

### Authentication Flow

1. User enters credentials
2. Supabase validates (server-side)
3. JWT token returned
4. Token encrypted and stored in MMKV
5. Token included in all API requests
6. RLS enforced on database layer

## Input Validation

### Email Validation

- **RFC 5322** compliant regex pattern
- Location: `lib/security.ts`
- No SQL injection via email field

```typescript
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

### Password Requirements

- **Minimum**: 12 characters
- **Required**: Uppercase, lowercase, numbers
- **Recommended**: Special characters
- **Enforced**: Server-side + client-side

### Rate Limiting

- **Login Attempts**: 5 per minute per IP
- **API Calls**: Configured in Supabase Edge Functions
- **Offline Queue**: Max 3 retries per action

## Error Handling

### Error Masking

```typescript
// ❌ DON'T: Expose sensitive data
catch (error) {
    Alert.alert("Error", error.message); // May contain DB details
}

// ✅ DO: Generic user messages
catch (error) {
    console.error("[Auth]", error); // Dev logging only
    Alert.alert("Lỗi", "Đăng nhập thất bại. Vui lòng thử lại");
}
```

### Development vs Production

- **Development**: Detailed error messages, stack traces
- **Production**: Generic messages to users
- **Logging**: Errors logged to console (dev) or monitoring service (prod)

```typescript
if (__DEV__) {
    console.error("Detailed error:", error);
} else {
    // Log to error tracking service
    errorTracker.log(error);
}
```

## Audit Logging

### Authentication Events

All auth events logged in `lib/logger.ts`:

- Login attempts (success/failure)
- Logout events
- Token refresh
- Failed authentication

### Failed Login Tracking

```typescript
authLogger.warn("Login failed", {
    email: email.substring(0, 3) + "***", // Masked
    reason: "Invalid credentials",
    timestamp: new Date().toISOString(),
});
```

### RLS Violation Monitoring

- Monitored via Supabase logs
- Alerts configured for suspicious patterns
- Review logs weekly

## Data Encryption

### MMKV Storage Encryption

- **Algorithm**: AES-256 (MMKV default)
- **Key**: Device-specific from environment
- **Scope**: All sensitive data (tokens, user info)

```typescript
// lib/storage.ts
storage = createMMKV({
    id: "my2light-storage",
    encryptionKey: getEncryptionKey(),
});
```

### Network Security

- **HTTPS Only**: All API calls over HTTPS
- **Certificate Pinning**: Recommended for production
- **TLS 1.2+**: Minimum version

## Security Checklist

### Before Deployment

- [ ] All `.env` variables set
- [ ] No hardcoded credentials
- [ ] RLS policies on all tables
- [ ] Password requirements enforced
- [ ] Rate limiting configured
- [ ] Error messages sanitized
- [ ] HTTPS enforced
- [ ] Audit logging enabled

### Regular Reviews

- [ ] Weekly: Review failed login attempts
- [ ] Monthly: Audit RLS policies
- [ ] Quarterly: Dependency security updates
- [ ] Annually: Penetration testing

## Common Vulnerabilities

### SQL Injection

**Prevention**: Supabase uses parameterized queries automatically

```typescript
// ✅ Safe: Supabase client
const { data } = await supabase.from("users").select("*").eq("email", userInput);

// ❌ Never: Raw SQL with user input
// await supabase.rpc('raw_query', { sql: `SELECT * FROM users WHERE email='${userInput}'` })
```

### XSS (Cross-Site Scripting)

**Prevention**: React Native escapes by default

```typescript
// ✅ Safe: React Native Text component
<Text>{userGeneratedContent}</Text>

// ❌ Avoid: dangerouslySetInnerHTML equivalent
```

### CSRF (Cross-Site Request Forgery)

**Prevention**: JWT tokens in headers (not cookies)

```typescript
// Supabase client automatically includes JWT
const { data } = await supabase.from("table").select("*");
```

## Incident Response

### Security Breach Protocol

1. **Immediate**: Revoke compromised tokens
2. **Within 1 hour**: Notify affected users
3. **Within 24 hours**: Root cause analysis
4. **Within 1 week**: Implement fixes
5. **Document**: Post-mortem report

### Contact

- **Security Issues**: [security contact placeholder]
- **Bug Reports**: GitHub Issues (non-security)

## References

- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [Supabase Security Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [React Native Security](https://reactnative.dev/docs/security)
