const express = require('express');
const router = express.Router();
const ocs = require('../services/ocsService');
const cache = require('../services/cacheService');
const { formatContent } = require('../services/formatter');

/**
 * GET /api/content/:itemId
 * Характеристики + фото одного товара
 */
router.get('/content/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const cacheKey = `content:${itemId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductContent([itemId]);
    const item = (data.result || [])[0];
    if (!item) return res.status(404).json({ error: 'Content not found' });

    const formatted = formatContent(item);
    cache.set(cacheKey, formatted, 86400); // фото/характеристики меняются редко — 24 часа
    res.json(formatted);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/content/batch
 * Характеристики + фото по списку артикулов
 * Body: { "itemIds": ["1000461530", "1000459619"] }
 */
router.post('/content/batch', async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds must be a non-empty array' });
    }

    const cacheKey = `content-batch:${itemIds.sort().join(',')}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await ocs.getProductContent(itemIds);
    const formatted = (data.result || []).map(formatContent);

    const response = { items: formatted, errors: data.errors || [] };
    cache.set(cacheKey, response, 86400);
    res.json(response);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/content/changes?from=2024-01-01
 * Товары с изменениями в контенте с указанной даты
 */
router.get('/content/changes', async (req, res) => {
  try {
    const { from } = req.query;
    if (!from) return res.status(400).json({ error: 'Query param "from" is required (e.g. ?from=2024-01-01)' });

    const data = await ocs.getContentChanges(from);
    res.json(data);
  } catch (err) {
    handleError(err, res);
  }
});

function handleError(err, res) {
  console.error('OCS Content error:', err?.response?.data || err.message);
  const status = err?.response?.status || 500;
  res.status(status).json({
    error: err?.response?.data || err.message,
  });
}

module.exports = router;
