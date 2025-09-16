"use client";
import { useEffect, useState, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import Image from "next/image";
import { formatCurrency } from "@/utils/formatCurrency";
import Link from "next/link";
import { Boxes, Plus, SquarePen, DollarSign } from "lucide-react";
import Pagination from "@/components/molecules/Pagination";

const SKELETON_COUNT = 10;

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

  // Cargar productos al montar o limpiar búsqueda
  useEffect(() => {
    if (!searching) {
      resetPagination();
      fetchProductsByPage({ page: 1, limit: 20 }); // 20 productos por página para admin
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      clearSearchResults();
      setSearching(false);
      return;
    }
    setSearching(true);
    await searchProducts(search);
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
    loadPageByNumber(pageNumber, { limit: 20 });
  }, [loadPageByNumber]);

  // Skeleton para lista
  const SkeletonRow = () => (
    <li className="list-row border border-[#e1e1e1] rounded-none flex items-center gap-4 p-2 animate-pulse">
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
      <div className="flex justify-between items-center mb-4 gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
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
                className="list-row border border-[#e1e1e1] rounded-none flex items-center gap-4 p-2"
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
                            {variant.color?.name ?? "-"}: {formatCurrency(variant.priceUSD, "es-US", "USD")}
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
            className="list-row border border-[#e1e1e1] rounded-none flex items-center gap-4 p-2"
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
                        {variant.color?.name ?? "-"}: {formatCurrency(variant.priceUSD, "es-US", "USD")}
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
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
