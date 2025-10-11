"use client";
import { useEffect, useState, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import Image from "next/image";
import { formatCurrency } from "@/utils/formatCurrency";
import Link from "next/link";
import { Boxes, Plus, SquarePen, DollarSign, Eye, AlertTriangle } from "lucide-react";
import Pagination from "@/components/molecules/Pagination";

const SKELETON_COUNT = 10;

// Categorías y subcategorías hardcodeadas (mismas que en CreateProductPage)
// NOTA: Los slugs deben coincidir con los de la base de datos
const CATEGORIES = [
  { id: "687817781dd5819a2483c7eb", name: "Hombres", slug: "hombres" },
  { id: "6878179f1dd5819a2483c7ed", name: "Mujeres", slug: "mujeres" },
  { id: "687817d71dd5819a2483c7ef", name: "Niños", slug: "ninos" },
];

const SUBCATEGORIES = [
  { id: "687819d2cdda2752c527177b", name: "Anteojos de sol", slug: "anteojos-de-sol-polarizados" },
  { id: "6878196acdda2752c5271779", name: "Armazón de receta", slug: "armazon-de-receta" },
  { id: "68781a06cdda2752c527177d", name: "Clip on", slug: "clip-on" },
];

const ProductsPage = () => {
  const {
    products,
    pagination,
    loading,
    error,
    fetchProductsByPage,
    searchResults,
    searchLoading,
    searchProducts,
    clearSearchResults,
    loadPageByNumber,
    resetPagination,
  } = useProducts();

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [inStock, setInStock] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string>("");

  // Cargar productos al montar o cuando cambien los filtros
  useEffect(() => {
    if (!searching) {
      resetPagination();
      fetchProductsByPage({ 
        page: 1, 
        limit: 20, 
        inStock,
        outOfStock,
        categorySlug: selectedCategorySlug || undefined,
        subcategorySlug: selectedSubcategorySlug || undefined,
      });
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, inStock, outOfStock, selectedCategorySlug, selectedSubcategorySlug]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      clearSearchResults();
      setSearching(false);
      return;
    }
    setSearching(true);
    await searchProducts({ q: search, inStock, outOfStock });
  };

  const handleClear = () => {
    setSearch("");
    clearSearchResults();
    setSearching(false);
  };

  // Función para manejar cambio de página
  const handlePageChange = useCallback((pageNumber: number) => {
    // Scroll hacia arriba inmediatamente cuando cambie de página
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    setCurrentPage(pageNumber);
    loadPageByNumber(pageNumber, { 
      limit: 20, 
      inStock,
      outOfStock,
      categorySlug: selectedCategorySlug || undefined,
      subcategorySlug: selectedSubcategorySlug || undefined,
    });
  }, [loadPageByNumber, inStock, outOfStock, selectedCategorySlug, selectedSubcategorySlug]);

  // Skeleton para lista
  const SkeletonRow = () => (
    <li className="flex flex-col gap-4 p-2 animate-pulse md:flex-row md:items-center border border-[#e1e1e1] rounded-none">
      <div className="w-10 h-10 bg-gray-200 rounded"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
      </div>
      <div className="w-16 h-6 bg-gray-200 rounded"></div>
    </li>
  );

  return (
    <div className="px-4 py-6">
      <h1 className="text-[#111111] font-bold text-2xl mb-4">
        Lista de productos
      </h1>
      <div className="flex flex-col gap-4 mb-4 md:flex-row md:justify-between md:items-center">
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md md:max-w-none">
          <input
            type="search"
            placeholder="Buscar por modelo o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] text-[#222222]"
          />
          <button
            type="submit"
            className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
            disabled={loading}
          >
            Buscar
          </button>
          {searching && (
            <button
              type="button"
              className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
              onClick={handleClear}
            >
              Limpiar
            </button>
          )}
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link href="/products/create">
            <button className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none">
              <Plus className="size-4" /> Nuevo
            </button>
          </Link>
          <Link href="/products/bulk-price-update">
            <button className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none">
              <DollarSign className="size-4" /> Precios Masivos
            </button>
          </Link>
        </div>
      </div>
      {/* Checkbox para filtrar por stock */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => {
                setInStock(e.target.checked);
                if (e.target.checked && outOfStock) {
                  setOutOfStock(false);
                }
              }}
              className="checkbox checkbox-neutral"
            />
            <span className="text-sm text-[#666666]">In Stock</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={outOfStock}
              onChange={(e) => {
                setOutOfStock(e.target.checked);
                if (e.target.checked && inStock) {
                  setInStock(false);
                }
              }}
              className="checkbox checkbox-neutral"
            />
            <span className="text-sm text-[#666666]">Out of Stock</span>
          </label>
        </div>
        <Link href="/products/stock-threshold">
          <button className="btn btn-sm rounded-none bg-orange-500 text-white border-orange-500 shadow-none hover:bg-orange-600">
            <AlertTriangle className="size-4" />
            Low Stock
          </button>
        </Link>
      </div>

      {/* Filtros de categoría y subcategoría */}
      <div className="mb-4 p-4 bg-[#ffffff] border border-[#e1e1e1] rounded-none shadow-sm">
        <h3 className="text-sm font-semibold text-[#111111] mb-3">Filtros</h3>
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex-1 w-full md:w-auto">
            <label className="text-xs text-[#7A7A7A] mb-1 block">Categoría</label>
            <select
              value={selectedCategorySlug}
              onChange={(e) => setSelectedCategorySlug(e.target.value)}
              className="select select-bordered bg-[#FFFFFF] text-[#222222] border border-[#e1e1e1] rounded-none w-full text-sm shadow-none focus:border-[#222222] focus:outline-none"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full md:w-auto">
            <label className="text-xs text-[#7A7A7A] mb-1 block">Subcategoría</label>
            <select
              value={selectedSubcategorySlug}
              onChange={(e) => setSelectedSubcategorySlug(e.target.value)}
              className="select select-bordered bg-[#FFFFFF] text-[#222222] border border-[#e1e1e1] rounded-none w-full text-sm shadow-none focus:border-[#222222] focus:outline-none"
            >
              <option value="">Todas las subcategorías</option>
              {SUBCATEGORIES.map((sub) => (
                <option key={sub.id} value={sub.slug}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
          {(selectedCategorySlug || selectedSubcategorySlug) && (
            <button
              onClick={() => {
                setSelectedCategorySlug("");
                setSelectedSubcategorySlug("");
              }}
              className="btn btn-sm rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none hover:bg-[#f5f5f5]"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {searching && (
        <div className="mb-6">
          <h3 className="text-lg text-[#222222] font-semibold mb-2">
            Resultados de la búsqueda{search && `: "${search}"`}
          </h3>
          <ul className="list bg-[#f8fafc] rounded-none shadow">
            {searchLoading &&
              Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <SkeletonRow key={idx} />
              ))}
            {!searchLoading && searchResults.length === 0 && (
              <li className="p-4 text-center text-sm opacity-60">
                No se encontraron productos
              </li>
            )}
            {searchResults.map((product) => (
              <li
                className="flex flex-col gap-4 p-2 md:flex-row md:items-center border border-[#e1e1e1] rounded-none"
                key={product.id}
              >
                <div>
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/${product.thumbnail}`}
                    alt={
                      product.productModel + " " + product.sku ||
                      "Product Image"
                    }
                    width={40}
                    height={40}
                  />
                </div>
                <div className="list-col-grow flex-1">
                  <div className="text-base font-medium text-[#222222]">
                    {product.productModel}
                  </div>
                  <div className="text-sm text-[#666666]">
                    {product.category.map((cat) => cat.name).join(", ")} -{" "}
                    {product.subcategory.name}
                  </div>
                  <div>
                    <div className="text-sm text-[#666666]">Precios:</div>
                    <div className="text-sm text-[#666666] space-y-1">
                      {product.variants && product.variants.length > 0 ? (
                        product.variants.map((variant) => (
                          <div key={variant.id}>
                            {variant.color?.name ?? "-"}: {formatCurrency(variant.priceUSD, "es-US", "USD")} - Costo promedio: {formatCurrency(variant.averageCostUSD, "es-US", "USD")}
                          </div>
                        ))
                      ) : (
                        <div>-</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-[#666666]">
                      Stock total:{" "}
                      {product.variants.reduce(
                        (total, variant) => total + variant.stock,
                        0
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/products/inventory/${product.id}`}>
                    <button
                      className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
                      title="Gestionar Inventario"
                    >
                      <Boxes className="size-4" />
                    </button>
                  </Link>
                  <Link href={`/products/edit/${product.id}`}>
                    <button
                      className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
                      title="Editar Producto"
                    >
                      <SquarePen className="size-4" />
                    </button>
                  </Link>
                  <Link href={`/products/preview/${product.slug}`}>
                    <button
                      className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
                      title="Vista Previa"
                    >
                      <Eye className="size-4" />
                    </button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Lista principal con paginación por scroll */}
      <ul className="list bg-[#ffffff] rounded-none shadow-md">
        {loading &&
          products.length === 0 &&
          Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
            <SkeletonRow key={idx} />
          ))}
        {error && <li className="p-4 text-center text-error">{error}</li>}
        {!loading && !error && products.length === 0 && (
          <li className="p-4 text-center text-sm opacity-60">
            No hay productos
          </li>
        )}
        {products.map((product) => (
          <li
            className="flex flex-col gap-4 p-2 md:flex-row md:items-center border border-[#e1e1e1] rounded-none"
            key={product.id}
          >
            <div>
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/${product.thumbnail}`}
                alt={
                  product.productModel + " " + product.sku ||
                  "Product Image"
                }
                width={40}
                height={40}
              />
            </div>
            <div className="list-col-grow flex-1">
              <div className="text-base font-medium text-[#222222]">
                {product.productModel}
              </div>
              <div className="text-sm text-[#666666]">
                {product.category.map((cat) => cat.name).join(", ")} -{" "}
                {product.subcategory.name}
              </div>
              <div>
                <div className="text-sm text-[#666666] space-y-1">
                  {product.variants && product.variants.length > 0 ? (
                    product.variants.map((variant) => (
                      <div key={variant.id}>
                        {variant.color?.name ?? "-"}: {formatCurrency(variant.priceUSD, "es-US", "USD")} - Costo promedio: {formatCurrency(variant.averageCostUSD, "es-US", "USD")}
                      </div>
                    ))
                  ) : (
                    <div>-</div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-[#666666]">
                  Stock total:{" "}
                  {product.variants.reduce(
                    (total, variant) => total + variant.stock,
                    0
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/products/inventory/${product.id}`}>
                <button
                  className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
                  title="Gestionar Inventario"
                >
                  <Boxes className="size-4" />
                </button>
              </Link>
              <Link href={`/products/edit/${product.id}`}>
                <button
                  className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
                  title="Editar Producto"
                >
                  <SquarePen className="size-4" />
                </button>
              </Link>
              <Link href={`/products/preview/${product.slug}`}>
                <button
                  className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
                  title="Vista Previa"
                >
                  <Eye className="size-4" />
                </button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
      
      {/* Componente de paginación */}
      {!searching && pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          loading={loading}
          className="mt-6"
        />
      )}

      {/* Información de resultados */}
      {!searching && pagination && (
        <div className="mt-4 text-sm text-[#666666] text-center">
          Mostrando {products.length} de {pagination.totalCount} productos
          {(selectedCategorySlug || selectedSubcategorySlug || inStock || outOfStock) && (
            <span className="block mt-1 text-xs">
              {selectedCategorySlug && (
                <span className="inline-block bg-[#e1e1e1] px-2 py-1 rounded-full mr-2">
                  {CATEGORIES.find(c => c.slug === selectedCategorySlug)?.name}
                </span>
              )}
              {selectedSubcategorySlug && (
                <span className="inline-block bg-[#e1e1e1] px-2 py-1 rounded-full mr-2">
                  {SUBCATEGORIES.find(s => s.slug === selectedSubcategorySlug)?.name}
                </span>
              )}
              {inStock && (
                <span className="inline-block bg-[#e1e1e1] px-2 py-1 rounded-full mr-2">
                  En stock
                </span>
              )}
              {outOfStock && (
                <span className="inline-block bg-[#e1e1e1] px-2 py-1 rounded-full">
                  Sin stock
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
