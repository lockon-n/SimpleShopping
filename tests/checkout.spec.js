const { test, expect } = require('../src/node_modules/@playwright/test');

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

  test('should show free shipping threshold message and qualify when enough', async ({ page }) => {
    // Initially, total is 0 so remaining should be 50.00
    await expect(page.locator('#free-shipping-msg')).toContainText('Add $50.00 to get free shipping');

    // Add Product 1 ($29.99) => remaining 20.01
    await page.click('text=Add to Cart >> nth=0');
    await expect(page.locator('#free-shipping-msg')).toContainText('Add $20.01');

    // Add Product 3 ($39.99) => total 69.98 => qualify
    await page.click('text=Add to Cart >> nth=2');
    await expect(page.locator('#free-shipping-msg')).toContainText('qualify for free shipping');
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

  test('should remove items from cart', async ({ page }) => {
    // Add two products
    await page.click('text=Add to Cart >> nth=0');
    await page.click('text=Add to Cart >> nth=1');

    // Verify both are present
    await expect(page.locator('#cart-items')).toContainText('Product 1');
    await expect(page.locator('#cart-items')).toContainText('Product 2');

    // Remove first item
    await page.click('text=Remove >> nth=0');

    // Verify Product 1 removed and total updated
    await expect(page.locator('#cart-items')).not.toContainText('Product 1');
    await expect(page.locator('#cart-items')).toContainText('Product 2');
    await expect(page.locator('#cart-total')).toContainText('49.99');
  });

  test('should apply SAVE10 coupon and update discount summary', async ({ page }) => {
    await page.click('text=Add to Cart >> nth=0'); // $29.99
    await page.fill('#coupon-code', 'SAVE10');
    await page.click('#apply-coupon');

    await expect(page.locator('#coupon-status')).toContainText('Coupon applied');
    await expect(page.locator('#summary-discount')).toContainText('3.00');
  });

  test('should calculate tax after discount (business rule)', async ({ page }) => {
    // Subtotal = 49.99 + 39.99 = 89.98
    await page.click('text=Add to Cart >> nth=1');
    await page.click('text=Add to Cart >> nth=2');

    // Apply 10% discount -> expected discount = 9.00; expected taxable = 80.98
    await page.fill('#coupon-code', 'SAVE10');
    await page.click('#apply-coupon');

    // Expect tax to be computed after discount -> 10% of 80.98 = 8.10
    // This is intentionally expected to fail due to current implementation
    await expect(page.locator('#summary-tax')).toContainText('8.10');
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