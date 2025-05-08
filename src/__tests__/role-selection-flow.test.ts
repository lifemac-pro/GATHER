/**
 * Role Selection Flow Test
 * 
 * This test verifies that the role selection and sign-in flow works properly.
 * 
 * To run this test:
 * 1. Start the development server: npm run dev
 * 2. In another terminal, run: npm test -- role-selection-flow
 */

import { test, expect } from '@playwright/test';

test.describe('Role Selection Flow', () => {
  test('should redirect to sign-in when accessing role-selection without authentication', async ({ page }) => {
    // Go to the role selection page
    await page.goto('/role-selection');
    
    // Should be redirected to sign-in
    await expect(page).toHaveURL(/.*sign-in.*/);
  });
  
  test('should show role selection dialog when clicking Get Started', async ({ page }) => {
    // Go to the home page
    await page.goto('/');
    
    // Click the Get Started button
    await page.click('text=Get Started');
    
    // Dialog should be visible
    await expect(page.locator('text=Choose Your Role')).toBeVisible();
    
    // Both role options should be visible
    await expect(page.locator('text=Event Admin')).toBeVisible();
    await expect(page.locator('text=Event Attendee')).toBeVisible();
  });
  
  test('should redirect to sign-in when selecting a role without authentication', async ({ page }) => {
    // Go to the home page
    await page.goto('/');
    
    // Click the Get Started button
    await page.click('text=Get Started');
    
    // Select the Admin role
    await page.click('text=Event Admin');
    
    // Click Continue
    await page.click('text=Continue');
    
    // Should be redirected to sign-in
    await expect(page).toHaveURL(/.*sign-in.*/);
  });
  
  // This test requires authentication, so it's skipped by default
  test.skip('should set role and redirect to dashboard after authentication', async ({ page }) => {
    // Sign in first (this requires a valid account)
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should be redirected to role selection
    await expect(page).toHaveURL(/.*role-selection.*/);
    
    // Select the Admin role
    await page.click('text=Event Admin');
    
    // Click Continue
    await page.click('text=Continue');
    
    // Should be redirected to admin dashboard
    await expect(page).toHaveURL(/.*admin\/dashboard.*/);
  });
});
