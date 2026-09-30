// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// Route -> Middleware -> Controller -> Service -> Database
// Apply caching & invalidation middleware to all product routes
router.use(cacheMiddleware);

// GET /products - Retrieve all products (Cached)
router.get('/', productController.getAllProducts);

// GET /products/:id - Retrieve single product by ID (Cached)
router.get('/:id', productController.getProductById);

// POST /products - Create a new product (Invalidates Cache)
router.post('/', productController.createProduct);

// PUT /products/:id - Replace product by ID (Invalidates Cache)
router.put('/:id', productController.updateProduct);

// PATCH /products/:id - Partially update product by ID (Invalidates Cache)
router.patch('/:id', productController.patchProduct);

// DELETE /products/:id - Delete product by ID (Invalidates Cache)
router.delete('/:id', productController.deleteProduct);

module.exports = router;
