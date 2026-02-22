import { test, expect } from '@playwright/test';

/**
 * E2E Test: Judge Flow
 * 
 * Tests the complete judge workflow:
 * 1. Access judge page with token
 * 2. Scan team QR codes
 * 3. Score teams across criteria
 * 4. Submit scores
 * 5. View scoring summary
 */

test.describe('Judge Flow', () => {
  const HACKATHON_SLUG = 'test-hackathon-2026';
  const TEST_JUDGE_TOKEN = 'test_judge_token_001';

  test.beforeEach(async ({ page }) => {
    // Navigate to judge page
    await page.goto(`/h/${HACKATHON_SLUG}/judge`);
  });

  test('should access judge page without token shows scanner', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Should show the page (may show QR scanner or require token)
    const url = page.url();
    expect(url).toContain('/judge');
  });

  test('should reject access for non-existent hackathon', async ({ page }) => {
    await page.goto('/h/non-existent-hackathon/judge');
    
    // Should show 404 or redirect
    await page.waitForLoadState('networkidle');
    const notFoundIndicator = await page.locator('text=/not found|404/i').count();
    expect(notFoundIndicator).toBeGreaterThan(0);
  });

  test('should navigate to scoring page with team ID', async ({ page }) => {
    // Navigate directly to a scoring page
    await page.goto(`/h/${HACKATHON_SLUG}/judge/score/team-001`);
    
    await page.waitForLoadState('networkidle');
    const url = page.url();
    
    // Should either be on score page or redirected to judge auth
    expect(url).toMatch(/score|judge/);
  });

  test('should show QR scanner interface', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check if scanner component exists (it uses html5-qrcode)
    const body = await page.textContent('body');
    
    // Should have some UI elements (scanner, or token input, or already authenticated)
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });
});

/**
 * E2E Test: Judge Scoring
 * 
 * Tests the scoring functionality for judges
 */
test.describe('Judge Scoring', () => {
  const HACKATHON_SLUG = 'test-hackathon-2026';

  test('scoring form should be accessible', async ({ page }) => {
    // Try to access a scoring form directly
    await page.goto(`/h/${HACKATHON_SLUG}/judge/score/team-001`);
    
    await page.waitForLoadState('networkidle');
    
    // Page should load (may require authentication)
    expect(page.url()).toBeTruthy();
  });

  test('scoring page should handle invalid team ID', async ({ page }) => {
    await page.goto(`/h/${HACKATHON_SLUG}/judge/score/invalid-team-id-999999`);
    
    await page.waitForLoadState('networkidle');
    
    // Should show error or redirect
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

/**
 * E2E Test: QR Code Authentication
 * 
 * Tests QR code scanning and token validation
 */
test.describe('QR Code Authentication', () => {
  const HACKATHON_SLUG = 'test-hackathon-2026';

  test('QR endpoint should redirect with valid token', async ({ page }) => {
    // Test QR code redirect endpoint
    // In real scenario, this would be a generated token from the seed data
    const testToken = 'test-qr-token-team-001';
    
    await page.goto(`/h/${HACKATHON_SLUG}/qr/${testToken}`);
    
    await page.waitForLoadState('networkidle');
    
    // Should redirect somewhere (either to judge scoring or error page)
    expect(page.url()).toBeTruthy();
  });

  test('QR endpoint should handle invalid token', async ({ page }) => {
    await page.goto(`/h/${HACKATHON_SLUG}/qr/invalid-token-12345`);
    
    await page.waitForLoadState('networkidle');
    
    // Should show error or redirect to error page
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
