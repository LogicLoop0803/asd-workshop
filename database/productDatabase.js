// database/productDatabase.js

// Mock in-memory database store
const productsDB = [
  { id: 1, name: 'Laptop Pro 15', price: 1299.99, category: 'Electronics', stock: 25 },
  { id: 2, name: 'Wireless Headphones', price: 199.99, category: 'Audio', stock: 50 },
  { id: 3, name: 'Mechanical Keyboard', price: 89.99, category: 'Accessories', stock: 100 },
  { id: 4, name: 'UltraWide Monitor', price: 499.99, category: 'Electronics', stock: 15 },
  { id: 5, name: 'Ergonomic Mouse', price: 49.99, category: 'Accessories', stock: 80 }
];

let nextId = 6;

const productDatabase = {
  async getAll() {
    return productsDB.map(p => ({ ...p }));
  },

  async getById(id) {
    const numId = Number(id);
    const product = productsDB.find(p => p.id === numId);
    return product ? { ...product } : null;
  },

  async create(data) {
    const newProduct = {
      id: nextId++,
      name: data.name || 'Unnamed Product',
      price: data.price !== undefined ? Number(data.price) : 0,
      category: data.category || 'General',
      stock: data.stock !== undefined ? Number(data.stock) : 0
    };
    productsDB.push(newProduct);
    return { ...newProduct };
  },

  async update(id, data) {
    const numId = Number(id);
    const index = productsDB.findIndex(p => p.id === numId);
    if (index === -1) return null;

    const updatedProduct = {
      id: numId,
      name: data.name !== undefined ? data.name : productsDB[index].name,
      price: data.price !== undefined ? Number(data.price) : productsDB[index].price,
      category: data.category !== undefined ? data.category : productsDB[index].category,
      stock: data.stock !== undefined ? Number(data.stock) : productsDB[index].stock
    };
    productsDB[index] = updatedProduct;
    return { ...updatedProduct };
  },

  async patch(id, data) {
    const numId = Number(id);
    const index = productsDB.findIndex(p => p.id === numId);
    if (index === -1) return null;

    const currentProduct = productsDB[index];
    const patchedProduct = {
      ...currentProduct,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.price !== undefined && { price: Number(data.price) }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.stock !== undefined && { stock: Number(data.stock) })
    };
    productsDB[index] = patchedProduct;
    return { ...patchedProduct };
  },

  async delete(id) {
    const numId = Number(id);
    const index = productsDB.findIndex(p => p.id === numId);
    if (index === -1) return false;

    productsDB.splice(index, 1);
    return true;
  },

  async reset(seedData) {
    productsDB.length = 0;
    if (seedData) {
      productsDB.push(...seedData.map(p => ({ ...p })));
    } else {
      productsDB.push(
        { id: 1, name: 'Laptop Pro 15', price: 1299.99, category: 'Electronics', stock: 25 },
        { id: 2, name: 'Wireless Headphones', price: 199.99, category: 'Audio', stock: 50 },
        { id: 3, name: 'Mechanical Keyboard', price: 89.99, category: 'Accessories', stock: 100 },
        { id: 4, name: 'UltraWide Monitor', price: 499.99, category: 'Electronics', stock: 15 },
        { id: 5, name: 'Ergonomic Mouse', price: 49.99, category: 'Accessories', stock: 80 }
      );
    }
    nextId = productsDB.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  }
};

module.exports = productDatabase;
