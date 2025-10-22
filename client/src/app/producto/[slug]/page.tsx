"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/utils/formatCurrency";
import BagIcon from "@/components/atoms/Icon/BagIcon";
import { MinusIcon, PlusIcon } from "lucide-react";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { cartEvents } from "@/utils/eventBus";
import { addItemToCart } from "@/redux/slices/cartSlice";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";

const ProductPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem, clearSpecificError, getAddItemLoading, getAddItemError } =
    useCart();

  // Usar el nuevo hook
  const { productDetail, loading, error, fetchProductBySlug } = useProducts();

  // Estado para el color seleccionado (ninguno al inicio)
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Estado para el modal de imagen
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Si no tenemos un slug en la URL, redirigimos a la página principal
  useEffect(() => {
    if (!slug) {
      router.push("/");
    }
  }, [slug, router]);

  useEffect(() => {
    if (typeof slug === "string" && slug) {
      fetchProductBySlug(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        {/* Skeleton Breadcrumb */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <span className="text-gray-300">/</span>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <span className="text-gray-300">/</span>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Skeleton Layout */}
        <div className="flex flex-col md:flex-row gap-6 animate-pulse">
          {/* Skeleton Image */}
          <div className="flex-1 flex justify-center items-start">
            <div className="w-full h-96 md:h-[500px] bg-gray-200 rounded-none"></div>
          </div>

          {/* Skeleton Product Details */}
          <div className="flex-1">
            {/* Skeleton Title */}
            <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>

            {/* Skeleton Price */}
            <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>

            {/* Skeleton Size */}
            <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>

            {/* Skeleton Colors Label */}
            <div className="h-4 w-12 bg-gray-200 rounded mb-2"></div>

            {/* Skeleton Color Options */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            </div>

            {/* Skeleton Quantity and Add to Cart */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-12 w-32 bg-gray-200 rounded"></div>
              <div className="h-12 w-48 bg-gray-200 rounded"></div>
            </div>

            {/* Skeleton Product Meta */}
            <div className="space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded"></div>
              <div className="h-4 w-56 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!productDetail) {
    return <div className="text-center">Producto no encontrado</div>;
  }

  // Obtener colores únicos de las variantes
  const uniqueColors = Array.from(
    new Map(productDetail.variants.map((v) => [v.color.hex, v.color])).values()
  );

  // Filtrar variantes con stock y encontrar la más barata por priceUSD
  const variantsWithStock = productDetail.variants.filter((v) => v.stock > 0);
  const cheapestVariant = variantsWithStock.length > 0
    ? variantsWithStock.reduce((min, v) => (v.priceUSD < min.priceUSD ? v : min))
    : productDetail.variants[0];

  // Encontrar la variante seleccionada según el color
  const selectedVariant = selectedColor
    ? productDetail.variants.find((v) => v.color.hex === selectedColor) || null
    : null;

  // Imágenes a mostrar: primaryImage si no hay variante seleccionada, si no la de la variante
  const imagesToShow = selectedVariant ? selectedVariant.images : productDetail.primaryImage;

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  // Agregar al carrito
  const handleAddToCart = async () => {
    if (!selectedVariant || selectedVariant.stock === 0) return;

    // Limpiar errores anteriores del carrito
    clearSpecificError("addItem");

    try {
      const result = await addItem({
        productVariantId: selectedVariant.id,
        quantity: quantity,
      });

      // Verificar si el thunk fue exitoso
      if (addItemToCart.fulfilled.match(result)) {
        // Éxito: abrir el cart drawer
        cartEvents.openCartDrawer();
      }
      // Los errores ya están manejados en el Redux slice
    } catch (error) {
      // Solo para errores realmente inesperados que no captura Redux
      console.error("Error inesperado al agregar al carrito:", error);
    }
  };

  const addLoading = selectedVariant
    ? getAddItemLoading(selectedVariant.id)
    : false;
  const addError = selectedVariant ? getAddItemError(selectedVariant.id) : null;

  return (
    <div className="container mx-auto p-4">
      {/* Breadcrumb DaisyUI */}
      <div className="mb-6 flex justify-center">
        <div className="breadcrumbs text-sm text-[#111111]">
          <ul>
            <li>
              <Link href="/" className="underline-animate no-underline">
                Inicio
              </Link>
            </li>
            {productDetail.category.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/categorias/${cat.slug}`}
                  className="underline-animate no-underline"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            {productDetail.category.map((cat) => (
              <li key={`subcat-${cat.slug}`}>
                <Link
                  href={`/categorias/${cat.slug}/${productDetail.subcategory.slug}`}
                  className="underline-animate no-underline"
                >
                  {productDetail.subcategory.name}
                  {productDetail.category.length > 1 && ` (${cat.name})`}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Responsive grid: image left, info right on desktop; stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Imágenes del producto */}
        <div className="flex-1 flex justify-center items-start">
          <div className="w-full max-w-md md:max-w-lg">
            <Swiper
              modules={[Navigation, Pagination, Zoom]}
              spaceBetween={10}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              zoom={{ maxRatio: 3 }}
              className="product-swiper"
              style={{
                maxHeight: "calc(100vh - (var(--navbar-height) + var(--breadcrumb-height)))",
              }}
            >
              {imagesToShow.map((image, index) => (
                <SwiperSlide key={index} zoom>
                  <div className="swiper-zoom-container">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/${image}`}
                      alt={`${productDetail.productModel} - Imagen ${index + 1}`}
                      width={400}
                      height={400}
                      className="w-full h-auto rounded-none object-contain cursor-pointer"
                      priority={index === 0}
                      onClick={() => {
                        setSelectedImage(image);
                        setModalOpen(true);
                      }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
        {/* Detalles del producto */}
        <div className="flex-1">
          <h1 className="text-3xl font-medium mb-4 text-[#222222]">
            {productDetail.productModel}
          </h1>
          <div className="mb-4">
            <p className="text-[#555555] text-xl font-normal mb-4">
              USD {(selectedVariant ? selectedVariant.priceUSD : cheapestVariant.priceUSD).toFixed(2)} -{" "}
              <span className="text-lg text-gray-500">
                {formatCurrency(
                  selectedVariant ? selectedVariant.priceARS : cheapestVariant.priceARS,
                  "es-AR",
                  "ARS"
                )}{" "}
                pesos
              </span>
            </p>
            {productDetail.size && (
              <p className="font-normal text-sm text-[#555555] font-dm mb-2">
                {productDetail.size}
              </p>
            )}
            {productDetail.description && (
              <p className="font-normal text-sm text-[#666666] mb-4 leading-relaxed">
                {productDetail.description}
              </p>
            )}
            <p className="font-normal text-sm text-[#777777] mb-2">Colores</p>
            <div className="flex items-center gap-2">
              {uniqueColors.map((c) => {
                // Encontrar la variante correspondiente a este color para verificar stock
                const variantForColor = productDetail.variants.find(
                  (v) => v.color.hex === c.hex
                );
                const isOutOfStock =
                  !variantForColor || variantForColor.stock === 0;

                return (
                  <button
                    key={c.hex}
                    type="button"
                    className="flex items-center gap-1 focus:outline-none relative"
                    onClick={() => {
                      if (!isOutOfStock) {
                        // Si el color ya está seleccionado, deseleccionarlo
                        if (selectedColor === c.hex) {
                          setSelectedColor(null);
                        } else {
                          setSelectedColor(c.hex);
                        }
                        // Limpiar error al seleccionar/deseleccionar un color
                        clearSpecificError("addItem");
                      }
                    }}
                  >
                    <div
                      className="tooltip"
                      data-tip={isOutOfStock ? `${c.name} - Sin stock` : c.name}
                    >
                      <span
                        className={`inline-block w-6 h-6 rounded-full border border-gray-300 relative ${
                          isOutOfStock
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        } ${
                          selectedColor === c.hex && !isOutOfStock
                            ? "ring-2 ring-black"
                            : ""
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {/* Línea diagonal para colores sin stock */}
                        {isOutOfStock && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-7 h-px bg-red-500 rotate-45 transform"></span>
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
              {/* Botón Clear - solo visible cuando hay color seleccionado */}
              {selectedColor && (
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-gray-600 bg-transparent hover:bg-gray-50 px-2 py-1 rounded transition-colors duration-200 focus:outline-none underline"
                  onClick={() => {
                    setSelectedColor(null);
                    clearSpecificError("addItem");
                  }}
                >
                  clear
                </button>
              )}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              {/* Selector de cantidad */}
              <div className="flex items-center border border-[#e1e1e1] bg-[#FFFFFF] text-[#888888] rounded-none h-12">
                <button
                  type="button"
                  className={`h-12 min-w-[28px] px-2 flex items-center justify-center transition-colors ${
                    !selectedVariant || quantity === 1
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : "hover:bg-[#222222] cursor-pointer"
                  }`}
                  onClick={
                    !selectedVariant || quantity === 1
                      ? undefined
                      : handleDecrease
                  }
                  aria-label="Disminuir cantidad"
                >
                  <MinusIcon size={18} />
                </button>
                <span className="px-4 select-none text-base h-12 flex items-center text-[#222222] border-l border-r border-[#e1e1e1]">
                  {quantity}
                </span>
                <button
                  type="button"
                  className={`h-12 min-w-[28px] px-2 flex items-center justify-center transition-colors ${
                    !selectedVariant ||
                    (selectedVariant && quantity >= selectedVariant.stock)
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : "hover:bg-[#222222] cursor-pointer"
                  }`}
                  onClick={
                    !selectedVariant ||
                    (selectedVariant && quantity >= selectedVariant.stock)
                      ? undefined
                      : handleIncrease
                  }
                  aria-label="Aumentar cantidad"
                >
                  <PlusIcon size={18} />
                </button>
              </div>
              {/* Botón agregar al carrito */}
              <div
                className={
                  selectedVariant && selectedVariant.stock > 0 ? "" : "tooltip"
                }
                data-tip={
                  !selectedVariant
                    ? "Selecciona un color antes de agregar al carrito"
                    : selectedVariant?.stock === 0
                    ? "Sin stock disponible"
                    : undefined
                }
              >
                <button
                  className={`btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 ${
                    selectedVariant && selectedVariant.stock > 0 && !addLoading
                      ? "bg-[#444444] text-white hover:bg-[#000000] cursor-pointer"
                      : "bg-[#7C7C7C] text-white cursor-not-allowed pointer-events-none"
                  }`}
                  onClick={
                    selectedVariant && selectedVariant.stock > 0 && !addLoading
                      ? handleAddToCart
                      : undefined
                  }
                >
                  {addLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Agregando...</span>
                    </>
                  ) : (
                    <>
                      <BagIcon />
                      <span className="ml-2">Agregar al carrito</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error específico para agregar al carrito */}
            {addError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {addError}
              </div>
            )}
          </div>
          <div className="mb-4">
            <p className="font-normal text-sm text-[#222222]">
              SKU: <span className="text-[#888888]">{productDetail.sku}</span>
            </p>
            <p className="font-normal text-sm text-[#222222]">
              Categorías:{" "}
              <span className="text-[#888888]">
                {productDetail.category.map((cat, idx, arr) => (
                  <span key={cat.slug}>
                    <Link
                      href={`/categorias/${cat.slug}`}
                      className="hover:underline"
                    >
                      {cat.name}
                    </Link>
                    {idx < arr.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </p>
            <p className="font-normal text-sm text-[#222222]">
              Subcategoria:{" "}
              <span className="text-[#888888]">
                {productDetail.category.length === 1 ? (
                  <Link
                    href={`/categorias/${productDetail.category[0].slug}/${productDetail.subcategory.slug}`}
                    className="hover:underline"
                  >
                    {productDetail.subcategory.name}
                  </Link>
                ) : (
                  productDetail.category.map((cat, idx, arr) => (
                    <span key={cat.slug}>
                      <Link
                        href={`/categorias/${cat.slug}/${productDetail.subcategory.slug}`}
                        className="hover:underline"
                      >
                        {productDetail.subcategory.name} ({cat.name})
                      </Link>
                      {idx < arr.length - 1 && ", "}
                    </span>
                  ))
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Modal para imagen en detalle */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl p-4 bg-black rounded-none">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10 text-white hover:bg-white hover:text-black"
              onClick={() => setModalOpen(false)}
            >
              ✕
            </button>
            <div className="flex justify-center items-center min-h-[60vh] py-8">
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/${selectedImage}`}
                alt={`${productDetail.productModel} - Imagen ampliada`}
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
