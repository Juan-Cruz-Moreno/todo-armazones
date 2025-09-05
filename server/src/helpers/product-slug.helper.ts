import limax from 'limax';

/**
 * @param productModel - Modelo del producto
 * @param sku - SKU del producto
 * @returns Slug generado
 */
export const generateProductSlug = async (productModel: string, sku: string): Promise<string> => {
  const modelSlug = limax(productModel);
  const skuSlug = limax(sku);

  return `${modelSlug}-${skuSlug}`;
};
