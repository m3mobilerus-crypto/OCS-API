const express = require('express');
const router = express.Router();
const ocs = require('../services/ocsService');
const cache = require('../services/cacheService');
const { formatProduct } = require('../services/formatter');

/**
 * GET /api/categories
 * Дерево категорий OCS
 */
router.get('/categories', async (req, res) => {
  try {
    const cacheKey = 'categories';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getCategories();
    cache.set(cacheKey, data, 86400); // кэш 24 часа
    res.json(data);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/catalog/:category
 * Товары по категории (или "all" для всех)
 * Пример: /api/catalog/all  или  /api/catalog/V060002
 */
router.get('/catalog/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const cacheKey = `catalog:${category}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductsByCategory(category);
    const formatted = (data.result || []).map(formatProduct);

    const response = { items: formatted, errors: data.errors || [] };
    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/catalog/batch
 * Товары по списку артикулов
 * Body: { "itemIds": ["1000461530", "1000459619"] }
 */
router.post('/catalog/batch', async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds must be a non-empty array' });
    }

    const cacheKey = `batch:${itemIds.sort().join(',')}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductsByIds(itemIds);
    const formatted = (data.result || []).map(formatProduct);

    const response = { items: formatted, errors: data.errors || [] };
    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/product/:itemId
 * Один товар по артикулу OCS
 */
router.get('/product/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const cacheKey = `product:${itemId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductsByIds([itemId]);
    const item = (data.result || [])[0];
    if (!item) return res.status(404).json({ error: 'Product not found' });

    const formatted = formatProduct(item);
    cache.set(cacheKey, formatted);
    res.json(formatted);
  } catch (err) {
    handleError(err, res);
  }
});

function handleError(err, res) {
  console.error('OCS API error:', err?.response?.data || err.message);
  const status = err?.response?.status || 500;
  res.status(status).json({
    error: err?.response?.data || err.message,
  });
}

module.exports = router;
