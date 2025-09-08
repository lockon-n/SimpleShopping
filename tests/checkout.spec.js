const { test, expect } = require('@playwright/test');

test.describe('E-Commerce Checkout Flow', () => {
  const baseURL = process.env.APP_URL || 'http://localhost:30123';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Frontend App/);
    await expect(page.locator('h1')).toContainText('Frontend App - E-Commerce Demo');
    await expect(page.locator('.pr-info')).toContainText('PR #123');
  });

  test('should add products to cart', async ({ page }) => {
    // Add Product 1 to cart
    await page.click('text=Add to Cart >> nth=0');
    
    // Verify cart is updated
    await expect(page.locator('#cart-items')).not.toContainText('Cart is empty');
    await expect(page.locator('#cart-items')).toContainText('Product 1');
    await expect(page.locator('#cart-total')).toContainText('29.99');
    
    // Add Product 2 to cart
    await page.click('text=Add to Cart >> nth=1');
    
    // Verify total is updated
    await expect(page.locator('#cart-total')).toContainText('79.98');
  });

  test('should change quantity and update totals', async ({ page }) => {
    await page.click('text=Add to Cart >> nth=0');
    await page.click('text=Add to Cart >> nth=0');

    // quantity should be 2 and total 59.98
    await expect(page.locator('#cart-items .qty')).toHaveText('2');
    await expect(page.locator('#cart-total')).toContainText('59.98');

    // decrease quantity
    await page.click('.cart-item .decrease-qty');
    await expect(page.locator('#cart-items .qty')).toHaveText('1');
    await expect(page.locator('#cart-total')).toContainText('29.99');
  });

  test('should remove product from cart and update total', async ({ page }) => {
    // Add two products
    await page.click('text=Add to Cart >> nth=0');
    await page.click('text=Add to Cart >> nth=1');

    // Ensure both present and total matches
    await expect(page.locator('#cart-items')).toContainText('Product 1');
    await expect(page.locator('#cart-items')).toContainText('Product 2');
    await expect(page.locator('#cart-total')).toContainText('79.98');

    // Click first remove button
    await page.click('.cart-item .remove-from-cart >> nth=0');

    // Now Product 1 should be removed, total should be 49.99
    await expect(page.locator('#cart-items')).not.toContainText('Product 1');
    await expect(page.locator('#cart-total')).toContainText('49.99');
  });

  test('should complete checkout process', async ({ page }) => {
    // Add a product to cart
    await page.click('text=Add to Cart >> nth=0');
    
    // Fill checkout form
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john.doe@example.com');
    await page.fill('#address', '123 Test Street, Test City');
    await page.fill('#card', '4111111111111111');
    
    // Submit form
    await page.click('#submit-button');
    
    // Verify success message
    await expect(page.locator('#checkout-success')).toBeVisible();
    await expect(page.locator('#checkout-success')).toContainText('Order Successful');
    
    // Verify order ID is generated
    const orderId = await page.locator('#order-id').textContent();
    expect(orderId).toMatch(/^ORD-[A-Z0-9]+$/);
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.click('#submit-button');
    
    // Check HTML5 validation (form should not submit)
    const nameInput = page.locator('#name');
    const validationMessage = await nameInput.evaluate(el => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should display PR information', async ({ page }) => {
    // Check PR info banner
    const prInfo = page.locator('.pr-info');
    await expect(prInfo).toBeVisible();
    await expect(prInfo).toContainText('PR #123');
    await expect(prInfo).toContainText('feature/pr-123');
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify elements are still visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.checkout-form')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.product-list')).toBeVisible();
  });

  test('performance: should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Page should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('API Health Checks', () => {
  const baseURL = process.env.APP_URL || 'http://localhost:30123';

  test('should return 200 status for homepage', async ({ request }) => {
    const response = await request.get(baseURL);
    expect(response.status()).toBe(200);
  });

  test('should have correct headers', async ({ request }) => {
    const response = await request.get(baseURL);
    expect(response.headers()['content-type']).toContain('text/html');
  });
});