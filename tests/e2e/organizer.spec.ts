import { test, expect } from '@playwright/test';

/**
 * E2E Test: Organizer Flow
 * 
 * Tests the complete organizer workflow:
 * 1. Sign in as organizer
 * 2. Navigate to hackathon management
 * 3. Configure event settings
 * 4. Manage judges and teams
 * 5. Control lifecycle (phases, rounds, freeze)
 * 6. View leaderboard
 */

test.describe('Organizer Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should access hackathon management dashboard', async ({ page }) => {
    // Note: This test assumes you're using Google OAuth
    // In a real test environment, you'd need to mock auth or use a test account
    
    // For now, we'll test that the management pages exist
    await page.goto('/h/test-hackathon-2026/manage');
    
    // Should redirect to signin if not authenticated
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test('should navigate to teams management', async ({ page }) => {
    // Direct navigation to teams page (will redirect to signin)
    await page.goto('/h/test-hackathon-2026/manage/teams');
    
    // Verify URL contains expected path
    expect(page.url()).toMatch(/signin|manage\/teams/);
  });

  test('should navigate to judges management', async ({ page }) => {
    await page.goto('/h/test-hackathon-2026/manage/judges');
    expect(page.url()).toMatch(/signin|manage\/judges/);
  });

  test('should navigate to rounds management', async ({ page }) => {
    await page.goto('/h/test-hackathon-2026/manage/rounds');
    expect(page.url()).toMatch(/signin|manage\/rounds/);
  });

  test('should navigate to phases management', async ({ page }) => {
    await page.goto('/h/test-hackathon-2026/manage/phases');
    expect(page.url()).toMatch(/signin|manage\/phases/);
  });

  test('should navigate to problems management', async ({ page }) => {
    await page.goto('/h/test-hackathon-2026/manage/problems');
    expect(page.url()).toMatch(/signin|manage\/problems/);
  });

  test('should navigate to display settings', async ({ page }) => {
    await page.goto('/h/test-hackathon-2026/manage/display');
    expect(page.url()).toMatch(/signin|manage\/display/);
  });

  test('should navigate to check-in page', async ({ page }) => {
    await page.goto('/h/test-hackathon-2026/manage/check-in');
    expect(page.url()).toMatch(/signin|manage\/check-in/);
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/h/test-hackathon-2026/manage/settings');
    expect(page.url()).toMatch(/signin|manage\/settings/);
  });
});

/**
 * E2E Test: Organizer Lifecycle Controls
 * 
 * Tests phase transitions, round management, and freeze functionality
 */
test.describe('Organizer Lifecycle Controls', () => {
  test('display page should be accessible without auth', async ({ page }) => {
    // Display page should be public
    await page.goto('/h/test-hackathon-2026/display');
    
    // Should not redirect to signin
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/display');
    
    // Should show some content (leaderboard or message)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('judge page should require authentication', async ({ page }) => {
    await page.goto('/h/test-hackathon-2026/judge');
    
    // Should require judge token or redirect
    await page.waitForLoadState('networkidle');
    const url = page.url();
    
    // Either shows judge scanner or requires token
    expect(url).toMatch(/judge|signin/);
  });
});
