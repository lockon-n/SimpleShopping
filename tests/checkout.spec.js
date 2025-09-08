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

  test('should apply SAVE10 coupon to reduce total by 10%', async ({ page }) => {
    // Add two products: 29.99 + 49.99 = 79.98
    await page.click('text=Add to Cart >> nth=0');
    await page.click('text=Add to Cart >> nth=1');

    // Subtotal should be 79.98
    await expect(page.locator('#cart-subtotal')).toContainText('79.98');

    // Apply coupon
    await page.fill('#coupon', 'SAVE10');
    await page.click('#apply-coupon');

    // Discount 7.998 -> 8.00, final total 71.98
    await expect(page.locator('#cart-discount')).toContainText('8.00');
    await expect(page.locator('#cart-total')).toContainText('71.98');
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

  test('should save order to localStorage and render order history', async ({ page }) => {
    await page.click('text=Add to Cart >> nth=0');
    await page.click('#submit-button');
    await expect(page.locator('#checkout-success')).toBeVisible();

    // order history visible
    await expect(page.locator('.order-history')).toBeVisible();

    // list should contain one item with ORD- prefix
    const text = await page.locator('#orders-list').textContent();
    expect(text).toMatch(/ORD-/);
  });

  test('should validate required fields', async ({ page }) => {
    // invalid email and card should show custom errors
    await page.fill('#name', 'J');
    await page.fill('#email', 'not-an-email');
    await page.fill('#address', '123');
    await page.fill('#card', '123');
    await page.click('#submit-button');

    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#card-error')).toBeVisible();
  });

  test('should display PR information', async ({ page }) => {
    // Check PR info banner
    const prInfo = page.locator('.pr-info');
    await expect(prInfo).toBeVisible();
    await expect(prInfo).toContainText('PR #123');
    await expect(prInfo).toContainText('feature/pr-123');
  });

  test('should toggle dark mode and update button label', async ({ page }) => {
    const btn = page.locator('#toggle-theme');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Switch to Dark Mode');

    await btn.click();
    await expect(btn).toContainText('Switch to Light Mode');

    // body should have class 'dark'
    const hasDark = await page.evaluate(() => document.body.classList.contains('dark'));
    expect(hasDark).toBeTruthy();

    // toggle back
    await btn.click();
    const hasDark2 = await page.evaluate(() => document.body.classList.contains('dark'));
    expect(hasDark2).toBeFalsy();
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