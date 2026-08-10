import { test, expect } from '@playwright/test';

test.describe('End-to-End Smoke Test - Attendance & Leave', () => {
  // Configured to test against production or local based on ENV
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Navigate to base URL
    await page.goto(baseURL);
  });

  test('Employee can log in and clock in/out', async ({ page }) => {
    // Assuming a login page at /login
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="username"]', 'praveen');
    await page.fill('input[name="password"]', 'password123'); // Adjust based on seed data
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify Clock In button is visible
    const clockInBtn = page.getByRole('button', { name: /Clock In/i });
    await expect(clockInBtn).toBeVisible();

    // Click Clock In
    await clockInBtn.click();

    // Verify status changes to "Clocked In" or button changes to "Clock Out"
    const clockOutBtn = page.getByRole('button', { name: /Clock Out/i });
    await expect(clockOutBtn).toBeVisible();
    
    // Click Clock Out
    await clockOutBtn.click();
  });

  test('HR Team View Accessibility', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="username"]', 'aravind');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Go to HR Attendance Dashboard
    await page.goto(`${baseURL}/dashboard/org/attendance`);
    await expect(page).toHaveURL(/.*org\/attendance/);

    // Verify table and graph loads
    await expect(page.getByText('Team Attendance')).toBeVisible();
  });

  test('Employee Leave Request Flow', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="username"]', 'praveen');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Go to Leave Request page
    await page.goto(`${baseURL}/dashboard/leave`);
    
    // Open Request Modal
    await page.click('button:has-text("Request Leave")');

    // Fill form
    await page.selectOption('select[name="type"]', 'sick');
    await page.fill('textarea[name="reason"]', 'Feeling unwell - Smoke Test');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for success toast
    await expect(page.getByText(/Leave request submitted successfully/i)).toBeVisible();
  });
});
