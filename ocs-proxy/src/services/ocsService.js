const axios = require('axios');

const OCS_BASE_URL = 'https://connector.b2b.ocs.ru';
const OCS_TEST_URL = 'https://testconnector.b2b.ocs.ru';

const baseURL = process.env.OCS_ENV === 'test' ? OCS_TEST_URL : OCS_BASE_URL;

const ocsClient = axios.create({
  baseURL,
  headers: {
    'accept': 'application/json',
    'X-API-Key': process.env.OCS_API_TOKEN,
  },
  timeout: 30000,
});

// ─── КАТАЛОГ ────────────────────────────────────────────────────────────────

/**
 * Получить дерево категорий
 */
async function getCategories() {
  const res = await ocsClient.get('/api/v2/catalog/categories');
  return res.data;
}

/**
 * Получить остатки и цены по категории
 * @param {string} category - код категории или "all"
 */
async function getProductsByCategory(category = 'all') {
  const params = {
    shipmentcity: process.env.OCS_SHIPMENT_CITY || 'Москва',
    includeregular: true,
    includesale: false,
    includeuncondition: false,
    includemissing: false,
    onlyavailable: false,
    withdescriptions: true,
  };

  const res = await ocsClient.get(
    `/api/v2/catalog/categories/${encodeURIComponent(category)}/products`,
    { params }
  );
  return res.data;
}

/**
 * Получить остатки и цены по списку артикулов (batch)
 * @param {string[]} itemIds - массив артикулов OCS
 */
async function getProductsByIds(itemIds) {
  const params = {
    shipmentcity: process.env.OCS_SHIPMENT_CITY || 'Москва',
    includeregular: true,
    includesale: false,
    includeuncondition: false,
    withdescriptions: true,
  };

  const res = await ocsClient.post(
    '/api/v2/catalog/products/batch',
    itemIds,
    { params }
  );
  return res.data;
}

// ─── КОНТЕНТ (характеристики + фото) ────────────────────────────────────────

/**
 * Получить характеристики и фотографии товаров
 * @param {string[]} itemIds - массив артикулов OCS
 */
async function getProductContent(itemIds) {
  const res = await ocsClient.post('/api/v2/content/batch', itemIds);
  return res.data;
}

/**
 * Получить список товаров с изменениями в контенте с указанной даты
 * @param {string} fromDate - дата в формате MM/DD/YYYY
 */
async function getContentChanges(fromDate) {
  const res = await ocsClient.get('/api/v2/content/changes', {
    params: { from: fromDate },
  });
  return res.data;
}

module.exports = {
  getCategories,
  getProductsByCategory,
  getProductsByIds,
  getProductContent,
  getContentChanges,
};
