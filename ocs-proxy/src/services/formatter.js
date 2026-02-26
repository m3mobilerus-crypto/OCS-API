/**
 * Форматирует один товар из каталога OCS
 * Оставляем только нужное: артикул, название, наличие, транзит, цена
 */
function formatProduct(item) {
  const { product, isAvailableForOrder, locations = [], price, packageInformation } = item;

  // Разбиваем locations на склад и транзит
  const stockLocations = [];
  const transitLocations = [];

  for (const loc of locations) {
    const entry = {
      location: loc.location,
      description: loc.description,
      quantity: loc.quantity?.value ?? 0,
      isGreatThan: loc.quantity?.isGreatThan ?? false,
      canReserve: loc.canReserve ?? false,
      arrivalDate: loc.arrivalDate || null,
      deliveryDate: loc.deliveryDate || null,
    };

    if (['ShipmentCity', 'Local', 'CO'].includes(loc.type)) {
      stockLocations.push(entry);
    } else if (['OuterTransit', 'TransitCO', 'InternalMovement'].includes(loc.type)) {
      transitLocations.push(entry);
    }
  }

  return {
    itemId: product.itemId,
    partNumber: product.partNumber,
    producer: product.producer,
    category: product.category,
    itemName: product.itemName,
    itemNameRus: product.itemNameRus,
    productName: product.productName,
    condition: product.condition,
    warranty: product.warranty,
    vatPercent: product.vatPercent,
    isAvailableForOrder,
    price: {
      order: price?.order || null,
      endUser: price?.endUser || null,
      priceList: price?.priceList || null,
    },
    stock: stockLocations,
    transit: transitLocations,
    package: packageInformation
      ? {
          weight: packageInformation.weight,
          width: packageInformation.width,
          height: packageInformation.height,
          depth: packageInformation.depth,
          minOrderQuantity: packageInformation.minOrderQuantity,
          multiplicity: packageInformation.multiplicity,
          units: packageInformation.units,
        }
      : null,
  };
}

/**
 * Форматирует контент товара (характеристики + фото)
 */
function formatContent(item) {
  return {
    itemId: item.itemId,
    partNumber: item.partNumber,
    producer: item.producer,
    itemName: item.itemName,
    properties: (item.properties || []).map((p) => ({
      name: p.name,
      value: p.value,
      unit: p.unit || null,
      type: p.type,
    })),
    images: (item.images || [])
      .sort((a, b) => a.order - b.order)
      .map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        size: img.size,
      })),
    mediumImages: (item.mediumImages || [])
      .sort((a, b) => a.order - b.order)
      .map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
      })),
  };
}

module.exports = { formatProduct, formatContent };
