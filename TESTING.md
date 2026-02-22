# Testing Guide for Hackaboard

This guide explains how to test the Hackaboard application with comprehensive test coverage including database seeding, security audits, E2E tests, and unit tests.

## Table of Contents

1. [Test Types](#test-types)
2. [Setup](#setup)
3. [Database Seeding](#database-seeding)
4. [Running Tests](#running-tests)
5. [Security Testing](#security-testing)
6. [Test Coverage](#test-coverage)
7. [CI/CD Integration](#cicd-integration)

## Test Types

### 1. Database Seeding
**What it is:** Integration/Smoke Testing  
**Purpose:** Populate database with realistic test data for manual and automated testing

The seed script creates:
- 1 organizer user
- 1 live hackathon (slug: `test--2026`)
- 10 teams with 40 total participants
- 5 judges with predictable tokens
- 3 problem statements (FinTech, HealthTech, Climate)
- 3 rounds with full scoring criteria
- Realistic submissions and scores

### 2. End-to-End (E2E) Tests
**What it is:** Integration/Acceptance Testing  
**Purpose:** Test complete user flows from browser perspective

Covers:
- **Organizer Flow:** Hackathon management, judge/team setup, lifecycle controls
- **Judge Flow:** QR scanning, team scoring, score submission
- **Participant Flow:** Registration, dashboard, problem selection, submissions
- **Display Flow:** Public leaderboard, auto-cycle, live updates, ceremony mode

### 3. Unit Tests
**What it is:** Component/Function Testing  
**Purpose:** Test individual functions in isolation

Covers:
- Scoring calculations (weighted averages, time bonuses)
- Tie-breaking logic
- Leaderboard computation
- Edge cases (no scores, single team, invalid data)

### 4. Security Tests
**What it is:** Vulnerability/Penetration Testing  
**Purpose:** Identify security vulnerabilities and authorization flaws

Checks:
- Authorization enforcement
- Token security (randomness, expiration)
- Data exposure (participant privacy)
- Input validation (XSS, SQL injection)
- Configuration security
- Database security

## Setup

### Install Test Dependencies

```bash
npm install
```

This installs:
- `@playwright/test` - E2E testing framework
- `vitest` - Unit testing framework
- `tsx` - TypeScript execution for seed/security scripts

### Environment Variables

Ensure your `.env` file contains:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
SOCKET_SERVER_URL="http://localhost:3001"
```

## Database Seeding

### Seed Test Data

```bash
npm run db:seed
```

This creates:
- **Hackathon:** test-hackathon-2026
- **Teams:** team-001 through team-010 (40 participants)
- **Judges:** 5 judges with tokens `test_judge_token_001` to `005`
- **Problems:** FinTech API, HealthTech Platform, Climate Dashboard
- **Rounds:** Ideation (30%), Prototype (35%), Final (35%)
- **Scores:** 3-4 judges per team, realistic scores

### Access Test Accounts

After seeding, the script outputs access URLs:

```
✅ Seed completed!

📊 Access URLs:
- Hackathon Page: http://localhost:3000/h/test-hackathon-2026
- Display: http://localhost:3000/h/test-hackathon-2026/display
- Registration: http://localhost:3000/h/test-hackathon-2026/register

👨‍⚖️ Judge Tokens:
- Judge 1 (Alice Chen): test_judge_token_001
- Judge 2 (Bob Martinez): test_judge_token_002
- Judge 3 (Carol Davis): test_judge_token_003
- Judge 4 (David Kim): test_judge_token_004
- Judge 5 (Emma Wilson): test_judge_token_005

🔐 To test as judge: http://localhost:3000/h/test-hackathon-2026/judge
Then enter one of the tokens above.
```

### Reset Database

To clear all data and re-seed:

```bash
npm run db:reset
```

**⚠️ WARNING:** This deletes ALL data in the database!

## Running Tests

### All Tests

Run everything (unit + security + E2E):

```bash
npm run test:all
```

### Unit Tests

```bash
npm test
```

Or with coverage:

```bash
npm test -- --coverage
```

### E2E Tests

Start dev server first:

```bash
npm run dev
```

In another terminal:

```bash
npm run test:e2e
```

With UI mode (interactive):

```bash
npm run test:e2e:ui
```

### Security Tests

```bash
npm run test:security
```

This checks:
- ✅ Authorization: Owner verification, duplicate score prevention
- ✅ Token Security: Judge token randomness, QR token strength
- ✅ Data Exposure: Participant email masking, judge comment filtering
- ✅ Input Validation: XSS prevention, SQL injection protection
- ✅ Configuration: Environment variables, HTTPS enforcement
- ✅ Database: Test user cleanup, SSL connections

## Security Testing

### Security Audit Checklist

See [SECURITY_AUDIT.md](../SECURITY_AUDIT.md) for detailed security analysis.

**Critical Issues:**
- No rate limiting on API endpoints
- Judge tokens don't expire
- CSRF protection needs verification

**High Priority:**
- Duplicate score prevention missing
- XSS sanitization needed
- Brute force protection required

**Medium Priority:**
- Predictable test tokens (okay for dev, not production)
- Participant data exposure risks
- Session management improvements

### Running Security Tests

The automated security test suite:

```bash
npm run test:security
```

Output example:

```
🔒 Security Test Suite
Running 6 test categories...

✅ Authorization Checks
  ✅ CRITICAL: Owner verification on management pages
  ✅ HIGH: Duplicate score prevention
  
✅ Token Security
  ⚠️  MEDIUM: Judge token randomness (predictable in test env)
  ✅ HIGH: QR token strength
  
❌ CRITICAL FAILURES: 0
❌ HIGH FAILURES: 0
⚠️  MEDIUM WARNINGS: 1

Overall: PASS
```

### Manual Security Testing

Test authorization manually:

```bash
# Try to access management without auth
curl http://localhost:3000/h/test-hackathon-2026/manage

# Try to score team twice as same judge
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{"teamId":"team-001","judgeId":"judge-001","scores":[...]}'
```

## Test Coverage

### Current Coverage

- **Scoring Logic:** Unit tests for calculations, tie-breaking ✅
- **Display Page:** E2E tests for leaderboard, auto-cycle, live updates ✅
- **Judge Flow:** E2E tests for scanning, scoring ✅
- **Participant Flow:** E2E tests for registration, dashboard ✅
- **Security:** Automated vulnerability scanning ✅

### Coverage Goals

Run with coverage report:

```bash
npm test -- --coverage
```

Target coverage:
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Seed test data
        run: npm run db:seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Run security tests
        run: npm run test:security
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### 1. Always Seed Before E2E Tests

```bash
npm run db:reset  # Fresh database
npm run dev       # Start server
npm run test:e2e  # Run E2E tests
```

### 2. Use Test Isolation

Each test should be independent:
- Don't rely on data from previous tests
- Clean up created resources
- Use unique identifiers

### 3. Test Real User Flows

E2E tests should mimic actual user behavior:
- Sign in → Create hackathon → Add judges → Score teams → View leaderboard
- Not just individual page loads

### 4. Security First

Run security tests after any changes to:
- Authentication/authorization
- API endpoints
- User input handling
- Database queries

### 5. Performance Testing

Monitor test execution time:
- Unit tests: <10ms each
- E2E tests: <5s each
- Full suite: <5 minutes

## Troubleshooting

### Seed Script Fails

```
Error: P2002: Unique constraint failed
```

**Solution:** Database already has data. Run `npm run db:reset`

### E2E Tests Timeout

```
Timeout of 30000ms exceeded
```

**Solution:** 
- Ensure dev server is running (`npm run dev`)
- Check DATABASE_URL is correct
- Verify Socket.IO server is running

### Security Tests Fail

```
CRITICAL: No rate limiting detected
```

**Solution:** This is expected. See [SECURITY_AUDIT.md](../SECURITY_AUDIT.md) for fixes.

### Can't Access Judge Page

```
403 Forbidden
```

**Solution:** Use a valid judge token from seed output:
- `test_judge_token_001` through `005`

## Next Steps

1. **Run Initial Tests:** `npm run db:seed && npm run test:all`
2. **Review Security Audit:** Read [SECURITY_AUDIT.md](../SECURITY_AUDIT.md)
3. **Fix Critical Issues:** Implement rate limiting, token expiration
4. **Add Custom Tests:** Create tests for your specific features
5. **Set Up CI/CD:** Add GitHub Actions workflow

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Prisma Seeding Guide](https://www.prisma.io/docs/guides/database/seed-database)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

**Questions?** Check the main [README.md](../README.md) or create an issue.
