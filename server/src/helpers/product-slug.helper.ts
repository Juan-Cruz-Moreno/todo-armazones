import limax from 'limax';
import Product from '@models/Product';

/**
 * Genera un slug único para el producto verificando unicidad en la base de datos
 * Optimizado para reducir colisiones agregando timestamp
 * @param productModel - Modelo del producto
 * @param sku - SKU del producto
 * @returns Slug generado único
 */
export const generateProductSlug = async (productModel: string, sku: string): Promise<string> => {
  // Agregar timestamp para reducir colisiones iniciales
  const timestamp = Date.now();
  const baseSlug = `${limax(productModel)}-${limax(sku)}-${timestamp}`;
  let slug = baseSlug;
  let counter = 1;

  // Verificar unicidad y agregar sufijo si es necesario (máximo 10 intentos para rendimiento)
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 10) {
      throw new Error('No se pudo generar un slug único después de 10 intentos');
    }
  }

  return slug;
};
