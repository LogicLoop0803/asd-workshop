// middleware/cacheMiddleware.js

// In-memory cache store: Key -> { data, createdAt }
const cacheStore = new Map();

// Time To Live (TTL) for cached data: 1 minute (60,000 milliseconds)
const DEFAULT_TTL_MS = 60 * 1000;

/**
 * Cache store management helper
 */
const cache = {
  get(key) {
    return cacheStore.get(key);
  },
  set(key, data, createdAt = Date.now()) {
    cacheStore.set(key, { data, createdAt });
  },
  delete(key) {
    cacheStore.delete(key);
  },
  clear() {
    cacheStore.clear();
  },
  size() {
    return cacheStore.size;
  },
  entries() {
    return Array.from(cacheStore.entries());
  }
};

/**
 * Express Caching Middleware
 * Layer: Route -> Middleware -> Controller -> Service -> Database
 */
function cacheMiddleware(req, res, next) {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Handle Cache Invalidation for data-modifying HTTP methods
  if (mutatingMethods.includes(req.method)) {
    res.on('finish', () => {
      // Invalidate all cache entries if stored data was successfully modified (2xx response)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.clear();
      }
    });
    return next();
  }

  // Caching mechanism for GET endpoints
  if (req.method === 'GET') {
    const key = req.originalUrl || req.url;
    const now = Date.now();
    const cachedEntry = cacheStore.get(key);

    if (cachedEntry) {
      const age = now - cachedEntry.createdAt;

      // Check if cached entry is within the 1-minute TTL
      if (age < DEFAULT_TTL_MS) {
        // Cache HIT - Serve cached response
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedEntry.data);
      }

      // Expired entry - purge from cache
      cacheStore.delete(key);
    }

    // Cache MISS (entry didn't exist or was expired)
    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to cache fresh response data on successful GET request
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data: body,
          createdAt: Date.now()
        });
      }
      return originalJson(body);
    };

    return next();
  }

  next();
}

module.exports = {
  cacheMiddleware,
  cache,
  DEFAULT_TTL_MS
};
