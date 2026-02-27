const express = require('express');
const router = express.Router();
const ocs = require('../services/ocsService');
const cache = require('../services/cacheService');
const { formatProduct } = require('../services/formatter');

// Фильтр — только наш бренд
const ALLOWED_PRODUCER = 'M3MOBILE CO., LTD.';

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
    cache.set(cacheKey, data, 86400);
    res.json(data);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/catalog/:category
 * Товары по категории — только M3 Mobile
 */
router.get('/catalog/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const cacheKey = `catalog:${category}:m3`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductsByCategory(category);

    const filtered = (data.result || [])
      .filter(item => item.product.producer === ALLOWED_PRODUCER)
      .map(formatProduct);

    const response = {
      total: filtered.length,
      items: filtered,
      errors: data.errors || []
    };

    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/catalog/batch
 * Товары по списку артикулов — только M3 Mobile
 * Body: { "itemIds": ["1000461530", "1000459619"] }
 */
router.post('/catalog/batch', async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds must be a non-empty array' });
    }

    const cacheKey = `batch:${itemIds.sort().join(',')}:m3`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductsByIds(itemIds);

    const filtered = (data.result || [])
      .filter(item => item.product.producer === ALLOWED_PRODUCER)
      .map(formatProduct);

    const response = {
      total: filtered.length,
      items: filtered,
      errors: data.errors || []
    };

    cache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/product/:itemId
 * Один товар по артикулу — только M3 Mobile
 */
router.get('/product/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const cacheKey = `product:${itemId}:m3`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductsByIds([itemId]);
    const item = (data.result || []).find(
      i => i.product.producer === ALLOWED_PRODUCER
    );

    if (!item) {
      return res.status(404).json({ error: 'Product not found or not M3 Mobile' });
    }

    const formatted = formatProduct(item);
    cache.set(cacheKey, formatted);
    res.json(formatted);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/m3
 * Все товары M3 Mobile одним запросом — основной маршрут для сайта
 */
router.get('/m3', async (req, res) => {
  try {
    const cacheKey = 'catalog:all:m3';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductsByCategory('all');

    const filtered = (data.result || [])
      .filter(item => item.product.producer === ALLOWED_PRODUCER)
      .map(formatProduct);

    const response = {
      total: filtered.length,
      items: filtered,
      errors: data.errors || []
    };

    cache.set(cacheKey, response);
    res.json(response);
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
