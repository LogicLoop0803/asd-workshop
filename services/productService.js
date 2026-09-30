// services/productService.js
const productDatabase = require('../database/productDatabase');

class ProductService {
  async getAllProducts() {
    return await productDatabase.getAll();
  }

  async getProductById(id) {
    const product = await productDatabase.getById(id);
    if (!product) {
      const error = new Error(`Product with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async createProduct(productData) {
    if (!productData || !productData.name || productData.price === undefined) {
      const error = new Error('Product name and price are required');
      error.statusCode = 400;
      throw error;
    }
    return await productDatabase.create(productData);
  }

  async updateProduct(id, productData) {
    const existing = await productDatabase.getById(id);
    if (!existing) {
      const error = new Error(`Product with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return await productDatabase.update(id, productData);
  }

  async patchProduct(id, patchData) {
    const existing = await productDatabase.getById(id);
    if (!existing) {
      const error = new Error(`Product with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return await productDatabase.patch(id, patchData);
  }

  async deleteProduct(id) {
    const existing = await productDatabase.getById(id);
    if (!existing) {
      const error = new Error(`Product with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return await productDatabase.delete(id);
  }
}

module.exports = new ProductService();
