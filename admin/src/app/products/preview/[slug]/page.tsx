"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";
import { formatCurrency } from "@/utils/formatCurrency";

const PreviewProductPage = () => {
  const { slug } = useParams();
  const router = useRouter();

  // Usar el hook de productos
  const { productDetail, loading, error, fetchProductBySlug } = useProducts();

  // Estado para el color seleccionado (ninguno al inicio)
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Estado para el modal de imagen
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Si no tenemos un slug en la URL, redirigimos a la página principal
  useEffect(() => {
    if (!slug) {
      router.push("/products");
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

  // Encontrar la variante seleccionada según el color
  const selectedVariant = selectedColor
    ? productDetail.variants.find((v) => v.color.hex === selectedColor) || null
    : null;

  // Imágenes a mostrar: primaryImage si no hay variante seleccionada, si no la de la variante
  const imagesToShow = selectedVariant ? selectedVariant.images : productDetail.primaryImage;

  return (
    <div className="container mx-auto p-4">
      {/* Breadcrumb */}
      <div className="mb-6 flex justify-center">
        <div className="breadcrumbs text-sm text-[#111111]">
          <ul>
            <li>
              <Link href="/products" className="underline-animate no-underline">
                Productos
              </Link>
            </li>
            <li>
              {productDetail.category.map((cat, idx, arr) => (
                <span key={cat.slug}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="underline-animate no-underline"
                  >
                    {cat.name}
                  </Link>
                  {idx < arr.length - 1 && "\u00A0"}
                </span>
              ))}
            </li>
            <li>
              <Link
                href={`/products?category=${productDetail.category[0]?.slug}&subcategory=${productDetail.subcategory.slug}`}
                className="underline-animate no-underline"
              >
                {productDetail.subcategory.name}
              </Link>
            </li>
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
              USD {productDetail.variants[0].priceUSD.toFixed(2)} -{" "}
              <span className="text-lg text-gray-500">
                {formatCurrency(
                  productDetail.variants[0].priceARS,
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
                      // Si el color ya está seleccionado, deseleccionarlo
                      if (selectedColor === c.hex) {
                        setSelectedColor(null);
                      } else {
                        setSelectedColor(c.hex);
                      }
                    }}
                  >
                    <div
                      className="tooltip"
                      data-tip={isOutOfStock ? `${c.name} - Sin stock` : c.name}
                    >
                      <span
                        className={`inline-block w-6 h-6 rounded-full border border-gray-300 relative cursor-pointer ${
                          isOutOfStock ? "opacity-50" : ""
                        } ${
                          selectedColor === c.hex ? "ring-2 ring-black" : ""
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
                  }}
                >
                  clear
                </button>
              )}
            </div>
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
                      href={`/products?category=${cat.slug}`}
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
                    href={`/products?category=${productDetail.category[0].slug}&subcategory=${productDetail.subcategory.slug}`}
                    className="hover:underline"
                  >
                    {productDetail.subcategory.name}
                  </Link>
                ) : (
                  productDetail.category.map((cat, idx, arr) => (
                    <span key={cat.slug}>
                      <Link
                        href={`/products?category=${cat.slug}&subcategory=${productDetail.subcategory.slug}`}
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
            {selectedVariant && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium text-sm mb-2">Información de variante seleccionada:</h3>
                <p className="text-sm">Color: {selectedVariant.color.name}</p>
                <p className="text-sm">Stock: {selectedVariant.stock}</p>
                <p className="text-sm">Precio: USD {selectedVariant.priceUSD.toFixed(2)}</p>
                <p className="text-sm">Costo promedio: USD {selectedVariant.averageCostUSD.toFixed(2)}</p>
              </div>
            )}
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

export default PreviewProductPage;
