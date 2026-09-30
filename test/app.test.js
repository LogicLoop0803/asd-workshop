// test/app.test.js
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
const productDatabase = require('../database/productDatabase');
const { cache } = require('../middleware/cacheMiddleware');

describe('Express Caching Application & Layered Architecture Tests', () => {
  beforeEach(async () => {
    await productDatabase.reset();
    cache.clear();
  });

  describe('1. Layered Architecture & Basic Endpoints', () => {
    it('GET /products should return 200 OK and initial products array', async () => {
      const res = await request(app).get('/products');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(Array.isArray(res.body), true);
      assert.strictEqual(res.body.length, 5);
    });

    it('GET /products/:id should return single product', async () => {
      const res = await request(app).get('/products/1');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, 1);
      assert.strictEqual(res.body.name, 'Laptop Pro 15');
    });

    it('GET /products/:id with invalid ID should return 404', async () => {
      const res = await request(app).get('/products/999');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error.status, 404);
    });
  });

  describe('2. Cache HIT and MISS Headers for GET endpoints', () => {
    it('First request to GET /products should be a Cache MISS, second request should be a Cache HIT', async () => {
      // First call -> MISS
      const res1 = await request(app).get('/products');
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.headers['x-cache'], 'MISS');

      // Second call -> HIT
      const res2 = await request(app).get('/products');
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers['x-cache'], 'HIT');
      assert.deepStrictEqual(res2.body, res1.body);
    });

    it('First request to GET /products/:id should be a Cache MISS, second request should be a Cache HIT', async () => {
      // First call -> MISS
      const res1 = await request(app).get('/products/2');
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.headers['x-cache'], 'MISS');

      // Second call -> HIT
      const res2 = await request(app).get('/products/2');
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers['x-cache'], 'HIT');
      assert.deepStrictEqual(res2.body, res1.body);
    });
  });

  describe('3. TTL (1 Minute) Expiration Behavior', () => {
    it('Should serve cached data before 1 minute, and fetch fresh data after 1 minute TTL expires', async () => {
      // 1. Initial GET -> MISS
      const res1 = await request(app).get('/products/3');
      assert.strictEqual(res1.headers['x-cache'], 'MISS');

      // 2. Immediate GET -> HIT
      const res2 = await request(app).get('/products/3');
      assert.strictEqual(res2.headers['x-cache'], 'HIT');

      // 3. Simulate TTL expiration by manually modifying the createdAt timestamp of the cached entry
      const entry = cache.get('/products/3');
      assert.ok(entry);
      assert.ok(entry.createdAt);

      // Set creation time to 61 seconds ago (older than 1 minute TTL)
      entry.createdAt = Date.now() - (61 * 1000);

      // 4. Request after expiration -> MISS, fresh fetch from DB
      const res3 = await request(app).get('/products/3');
      assert.strictEqual(res3.headers['x-cache'], 'MISS');
      assert.strictEqual(res3.status, 200);

      // 5. Subsequent request -> HIT again with fresh timestamp
      const res4 = await request(app).get('/products/3');
      assert.strictEqual(res4.headers['x-cache'], 'HIT');
    });
  });

  describe('4. Cache Invalidation on Successful Modifications (POST, PUT, PATCH, DELETE)', () => {
    it('POST /products should invalidate existing cache entries', async () => {
      // Warm cache
      await request(app).get('/products');
      await request(app).get('/products/1');
      assert.ok(cache.size() >= 2);

      // Create new product
      const postRes = await request(app)
        .post('/products')
        .send({ name: '4K Webcam', price: 129.99, category: 'Electronics', stock: 40 });
      assert.strictEqual(postRes.status, 201);

      // Cache should be completely cleared
      assert.strictEqual(cache.size(), 0);

      // Next GET request should be a MISS and contain the newly added product
      const getRes = await request(app).get('/products');
      assert.strictEqual(getRes.headers['x-cache'], 'MISS');
      assert.strictEqual(getRes.body.length, 6);
      assert.ok(getRes.body.some(p => p.name === '4K Webcam'));
    });

    it('PUT /products/:id should invalidate cache entries', async () => {
      // Warm cache
      await request(app).get('/products');
      await request(app).get('/products/1');
      assert.ok(cache.size() >= 2);

      // Update product
      const putRes = await request(app)
        .put('/products/1')
        .send({ name: 'Laptop Pro 16 Ultimate', price: 1599.99, category: 'Electronics', stock: 10 });
      assert.strictEqual(putRes.status, 200);

      // Cache should be cleared
      assert.strictEqual(cache.size(), 0);

      // Next GET /products/1 should be MISS and have updated data
      const getRes = await request(app).get('/products/1');
      assert.strictEqual(getRes.headers['x-cache'], 'MISS');
      assert.strictEqual(getRes.body.name, 'Laptop Pro 16 Ultimate');
    });

    it('PATCH /products/:id should invalidate cache entries', async () => {
      // Warm cache
      await request(app).get('/products/2');
      assert.strictEqual(cache.size(), 1);

      // Patch product
      const patchRes = await request(app)
        .patch('/products/2')
        .send({ price: 149.99 });
      assert.strictEqual(patchRes.status, 200);

      // Cache cleared
      assert.strictEqual(cache.size(), 0);

      // Next GET should be MISS and reflect new price
      const getRes = await request(app).get('/products/2');
      assert.strictEqual(getRes.headers['x-cache'], 'MISS');
      assert.strictEqual(getRes.body.price, 149.99);
    });

    it('DELETE /products/:id should invalidate cache entries', async () => {
      // Warm cache
      await request(app).get('/products');
      await request(app).get('/products/5');
      assert.ok(cache.size() >= 2);

      // Delete product 5
      const deleteRes = await request(app).delete('/products/5');
      assert.strictEqual(deleteRes.status, 200);

      // Cache cleared
      assert.strictEqual(cache.size(), 0);

      // GET /products should be MISS and show 4 products remaining
      const getRes = await request(app).get('/products');
      assert.strictEqual(getRes.headers['x-cache'], 'MISS');
      assert.strictEqual(getRes.body.length, 4);
    });

    it('Failed POST (e.g. 400 Bad Request) should NOT invalidate existing cache', async () => {
      // Warm cache
      await request(app).get('/products');
      assert.strictEqual(cache.size(), 1);

      // Send invalid POST (missing required fields)
      const postRes = await request(app).post('/products').send({});
      assert.strictEqual(postRes.status, 400);

      // Cache should remain intact!
      assert.strictEqual(cache.size(), 1);

      // Next GET should still be a HIT
      const getRes = await request(app).get('/products');
      assert.strictEqual(getRes.headers['x-cache'], 'HIT');
    });
  });
});
