// app.js
const express = require('express');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Mount routes: Route -> Middleware -> Controller -> Service -> Database
app.use('/products', productRoutes);

// Home / documentation route
app.get('/', (req, res) => {
  res.json({
    message: 'Express Caching Application API',
    layeredStructure: 'Route -> Middleware -> Controller -> Service -> Database',
    endpoints: {
      getAllProducts: 'GET /products',
      getProductById: 'GET /products/:id',
      createProduct: 'POST /products',
      updateProduct: 'PUT /products/:id',
      patchProduct: 'PATCH /products/:id',
      deleteProduct: 'DELETE /products/:id'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      status
    }
  });
});

module.exports = app;
