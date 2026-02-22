# Security Audit Checklist for Hackaboard

## 🔒 Authentication & Authorization

### NextAuth Implementation
- [x] Using NextAuth v5 with Google OAuth
- [ ] **TODO**: Session token rotation implemented
- [ ] **TODO**: CSRF protection enabled (NextAuth default)
- [ ] **VERIFY**: Secure session cookie settings (httpOnly, secure, sameSite)

### Access Control Issues Found:
1. ⚠️ **CRITICAL**: Judge authentication (`src/actions/scoring.ts`)
   - Uses simple token from cookie without expiration
   - No rate limiting on judge scoring
   - **Fix**: Add token expiration, rate limiting

2. ⚠️ **HIGH**: Participant dashboard access (`src/app/h/[slug]/dashboard/page.tsx`)
   - QR token in cookie without expiration
   - No brute force protection
   - **Fix**: Add token expiration, max attempts

3. ⚠️ **MEDIUM**: Organizer ownership checks
   - Good: Verified in server actions
   - **Verify**: All organizer routes check `userId`

### Recommendations:
- [ ] Implement session management with expiration
- [ ] Add rate limiting middleware
- [ ] Implement account lockout after failed attempts
- [ ] Add 2FA for organizer accounts

---

## 🛡️ Input Validation & Sanitization

### Server Actions
1. ✅ **GOOD**: Zod validation in most server actions
2. ⚠️ **VERIFY**: All user inputs validated server-side
3. ⚠️ **CHECK**: XSS prevention in dynamic content

### Issues Found:
1. ⚠️ **MEDIUM**: Team/participant names displayed without escaping
   - Location: TeamRow component, dashboard displays
   - **Risk**: Stored XSS if names contain HTML/JavaScript
   - **Fix**: Sanitize all user-generated content

2. ⚠️ **LOW**: Problem statement descriptions
   - Allows arbitrary text, displayed in multiple places
   - **Fix**: Add content sanitization library (DOMPurify)

### Recommendations:
- [ ] Add input sanitization for all user content
- [ ] Implement Content Security Policy (CSP)
- [ ] Validate file URLs (submission links)
- [ ] Add max length limits on all text fields

---

## 🗄️ SQL Injection

### Status: ✅ **LOW RISK**
- Using Prisma ORM which prevents SQL injection by default
- No raw SQL queries found in codebase

### Verification Needed:
- [ ] Review all Prisma queries for unsafe operations
- [ ] Check if any raw SQL is used anywhere

---

## 🔐 Authorization Bypass

### Issues Found:

1. ⚠️ **CRITICAL**: Display configuration (`src/actions/display.ts`)
   ```typescript
   // updateDisplayConfig checks ownership ✅
   // But getDisplayState is public - anyone can view
   ```
   - **Status**: ACCEPTABLE (display is meant to be public)
   - **Verify**: Freeze state properly hides sensitive data

2. ⚠️ **HIGH**: Judge scoring access control
   - File: `src/actions/scoring.ts`
   - Judges can score any team if they have valid token
   - **Missing**: Check if judge already scored this team+round
   - **Fix**: Add duplicate score prevention

3. ⚠️ **MEDIUM**: Participant can view any team's QR
   - If participant knows another team's QR token, they can access dashboard
   - **Risk**: Privacy leak, dashboard hijacking
   - **Fix**: Add team member verification

### Recommendations:
- [ ] Implement proper RBAC (Role-Based Access Control)
- [ ] Add ownership checks on all sensitive operations
- [ ] Log all authorization failures

---

## 🌐 API Security

### Socket.IO Server
File: `socket-server/index.ts`

1. ⚠️ **CRITICAL**: Emit endpoint authentication
   ```typescript
   if (secret !== EMIT_SECRET) {
     res.status(401).json({ error: "Unauthorized" })
   }
   ```
   - ✅ GOOD: Secret-based authentication
   - ⚠️ **Missing**: No rate limiting on /emit endpoint
   - ⚠️ **Missing**: No logging of failed attempts

2. ⚠️ **MEDIUM**: Room join validation
   - Only validates hackathonId format
   - No verification that hackathon exists
   - **Risk**: Users can join non-existent rooms

3. ⚠️ **LOW**: CORS configuration
   - Allows single origin from env variable ✅
   - **Verify**: Production CORS settings properly configured

### Recommendations:
- [ ] Add rate limiting to Socket.IO endpoints
- [ ] Implement room access control (verify user permissions)
- [ ] Add comprehensive logging for security events
- [ ] Set up monitoring/alerting for suspicious activity

---

## 🔑 Secret Management

### Issues Found:

1. ⚠️ **MEDIUM**: Judge tokens are predictable
   - Created as simple strings without cryptographic randomness
   - **Fix**: Use crypto.randomBytes() or UUID v4

2. ⚠️ **MEDIUM**: Participant QR tokens
   - Generated client-side or with timestamp (predictable)
   - **Fix**: Use cryptographically secure random tokens

3. ✅ **GOOD**: Environment variables
   - Using .env.local for secrets
   - **Verify**: .env.local in .gitignore

### Recommendations:
- [ ] Use crypto.randomBytes(32).toString('hex') for all tokens
- [ ] Rotate secrets regularly
- [ ] Implement secret scanning in CI/CD
- [ ] Add vault solution for production (AWS Secrets Manager, etc.)

---

## 💾 Data Exposure

### Issues Found:

1. ⚠️ **HIGH**: Participant data exposure
   - Participant emails/phones queryable
   - **Risk**: Personal data leak
   - **Fix**: Limit exposed fields in API responses

2. ⚠️ **MEDIUM**: Score comments visible
   - Judge comments stored in database
   - Not clear if exposed to participants
   - **Verify**: Comments should only be organizer-visible

3. ⚠️ **LOW**: Team invite codes
   - Exposed in UI, could be enumerated
   - **Risk**: Low (designed to be shared)

### Recommendations:
- [ ] Implement data minimization (only return needed fields)
- [ ] Add privacy controls for personal information
- [ ] Implement data retention policies
- [ ] Add GDPR compliance features (data export, deletion)

---

## 🚦 Rate Limiting & DoS Protection

### Issues Found:

1. ⚠️ **CRITICAL**: No rate limiting anywhere
   - Server actions can be called unlimited times
   - **Risk**: DoS attacks, score manipulation
   - **Targets**:
     - Score submission
     - Team registration
     - Judge authentication
     - Display updates

2. ⚠️ **HIGH**: Socket.IO event flooding
   - No limits on event emissions
   - **Risk**: Server overload

### Recommendations:
- [ ] Add rate limiting middleware (next-rate-limit)
- [ ] Implement request throttling per IP/user
- [ ] Add CAPTCHA for sensitive operations
- [ ] Set up DDoS protection (Cloudflare, etc.)

---

## 🔍 Information Disclosure

### Issues Found:

1. ⚠️ **LOW**: Error messages
   - Review if detailed errors exposed to client
   - **Example**: Prisma errors in server actions
   - **Fix**: Return generic error messages

2. ⚠️ **LOW**: Console logs in production
   - Check for console.log statements with sensitive data
   - **Fix**: Remove or gate behind environment checks

### Recommendations:
- [ ] Implement proper error handling
- [ ] Remove debug logs in production build
- [ ] Add error monitoring (Sentry, etc.)

---

## 🔄 CSRF & XSS Protection

### CSRF Status: ✅ **PROTECTED**
- NextAuth provides CSRF protection
- Server actions use POST with form tokens

### XSS Status: ⚠️ **NEEDS REVIEW**
1. React escapes most content by default ✅
2. **Check**: `dangerouslySetInnerHTML` usage (none found ✅)
3. **Verify**: User-generated content properly escaped

---

## 📋 Compliance & Privacy

### GDPR Considerations:
- [ ] Add privacy policy
- [ ] Implement data export functionality
- [ ] Add data deletion (right to be forgotten)
- [ ] Get consent for data processing
- [ ] Add cookie consent banner

### Data Handling:
- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS in production (TLS 1.3)
- [ ] Implement backup encryption
- [ ] Add audit logging

---

## 🎯 Priority Fixes

### 🔴 CRITICAL (Fix Immediately):
1. Add rate limiting on all server actions
2. Implement proper token expiration for judges/participants
3. Add authentication on Socket.IO emit endpoint rate limit

### 🟠 HIGH (Fix Soon):
1. Implement duplicate score prevention
2. Add content sanitization for user inputs
3. Use cryptographically secure token generation
4. Add brute force protection on login/authentication

### 🟡 MEDIUM (Plan to Fix):
1. Implement RBAC system
2. Add comprehensive audit logging
3. Privacy controls for personal data
4. Session management improvements

### 🟢 LOW (Nice to Have):
1. 2FA for organizers
2. GDPR compliance features
3. Advanced monitoring/alerting

---

## 🧪 Security Testing Commands

Run these tests to verify security:

```bash
# 1. Dependency vulnerability scan
npm audit

# 2. Check for secrets in code
npx gitleaks detect

# 3. Static security analysis
npx eslint-plugin-security

# 4. Check for hardcoded credentials
grep -r "password\|secret\|api_key" src/

# 5. Test HTTPS redirect (production)
curl -I http://yourdomain.com

# 6. Verify security headers
curl -I https://yourdomain.com | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security"
```

---

## 📚 Security Best Practices

### Code Review Checklist:
- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] Authorization checks on all routes
- [ ] Error handling doesn't leak info
- [ ] Logging doesn't include sensitive data
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] Rate limiting in place

### Deployment Checklist:
- [ ] Environment variables properly set
- [ ] Database backups enabled
- [ ] SSL/TLS certificates valid
- [ ] Security monitoring active
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled
