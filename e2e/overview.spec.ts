import { expect, test } from '@playwright/test';

const overviewPath = '/en-US/app/fleet_overview/home';

test('keeps the selected chart resolution after reloading the overview', async ({ page }) => {
    await page.goto(overviewPath);
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('password');
    await password.press('Enter');

    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible();
    await page.getByRole('combobox', { name: 'Resolution: 1 hour' }).click();
    await page.getByRole('option', { name: /^15 minutes/ }).click();

    const resolution = page.getByRole('combobox', { name: 'Resolution: 15 minutes' });
    await expect(resolution).toBeVisible();

    await page.reload();
    await expect(resolution).toBeVisible();
});
