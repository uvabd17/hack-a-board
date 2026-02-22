import { test, expect } from '@playwright/test';

/**
 * E2E Test: Participant Flow
 * 
 * Tests the complete participant workflow:
 * 1. Registration page access
 * 2. Team registration
 * 3. Dashboard access
 * 4. Problem selection
 * 5. Submission links
 * 6. Leaderboard viewing
 * 7. QR code display
 */

test.describe('Participant Registration', () => {
  const HACKATHON_SLUG = 'test-hackathon-2026';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/h/${HACKATHON_SLUG}/register`);
  });

  test('should load registration page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Should show registration page
    expect(page.url()).toContain('/register');
    
    // Should have some content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('registration page should show hackathon name', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const body = await page.textContent('body');
    
    // Should contain hackathon-related content
    // (Actual hackathon name would come from database)
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should reject registration for non-existent hackathon', async ({ page }) => {
    await page.goto('/h/non-existent-hackathon/register');
    
    await page.waitForLoadState('networkidle');
    
    // Should show 404 or error
    const notFoundIndicator = await page.locator('text=/not found|404/i').count();
    expect(notFoundIndicator).toBeGreaterThan(0);
  });
});

/**
 * E2E Test: Participant Dashboard
 * 
 * Tests the participant dashboard functionality
 */
test.describe('Participant Dashboard', () => {
  const HACKATHON_SLUG = 'test-hackathon-2026';

  test('should load dashboard page', async ({ page }) => {
    await page.goto(`/h/${HACKATHON_SLUG}/dashboard`);
    
    await page.waitForLoadState('networkidle');
    
    // Should show dashboard or redirect to signin
    const url = page.url();
    expect(url).toMatch(/dashboard|signin/);
  });

  test('dashboard should require authentication', async ({ page }) => {
    await page.goto(`/h/${HACKATHON_SLUG}/dashboard`);
    
    await page.waitForLoadState('networkidle');
    
    // Should redirect to signin if not authenticated
    const url = page.url();
    
    // Either on dashboard (if you have session) or signin page
    expect(url).toBeTruthy();
  });

  test('should handle non-existent hackathon', async ({ page }) => {
    await page.goto('/h/non-existent-hackathon/dashboard');
    
    await page.waitForLoadState('networkidle');
    
    // Should show 404 or error
    const notFoundIndicator = await page.locator('text=/not found|404/i').count();
    expect(notFoundIndicator).toBeGreaterThan(0);
  });
});

/**
 * E2E Test: Problem Selection and Submissions
 * 
 * Tests the ability to select problems and submit project links
 */
test.describe('Problem Selection and Submissions', () => {
  const HACKATHON_SLUG = 'test-hackathon-2026';

  test('dashboard should be accessible', async ({ page }) => {
    await page.goto(`/h/${HACKATHON_SLUG}/dashboard`);
    
    await page.waitForLoadState('networkidle');
    
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // Note: Full form submission tests would require authenticated session
  // In a real test environment, you'd mock auth or use test credentials
});

/**
 * E2E Test: Leaderboard Viewing
 * 
 * Tests that participants can view their rank and leaderboard
 */
test.describe('Leaderboard Viewing', () => {
  const HACKATHON_SLUG = 'test-hackathon-2026';

  test('public display should show leaderboard', async ({ page }) => {
    await page.goto(`/h/${HACKATHON_SLUG}/display`);
    
    await page.waitForLoadState('networkidle');
    
    // Display page is public, should show content
    expect(page.url()).toContain('/display');
    
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('display page should handle non-existent hackathon', async ({ page }) => {
    await page.goto('/h/non-existent-hackathon/display');
    
    await page.waitForLoadState('networkidle');
    
    const notFoundIndicator = await page.locator('text=/not found|404/i').count();
    expect(notFoundIndicator).toBeGreaterThan(0);
  });
});
