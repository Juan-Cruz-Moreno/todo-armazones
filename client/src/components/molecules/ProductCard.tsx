"use client";

import { Product } from "@/interfaces/product";
import Image from "next/image";
import Link from "next/link";
import BagIcon from "../atoms/Icon/BagIcon";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCart } from "@/hooks/useCart";
import { cartEvents, searchEvents } from "@/utils/eventBus";
import { useState } from "react";
import LoadingSpinner from "../atoms/LoadingSpinner";
import { addItemToCart } from "@/redux/slices/cartSlice";
import { motion } from "framer-motion";

interface ProductCardProps extends Product {
  ariaAttributes?: {
    role?: string;
    "aria-colindex"?: number;
    "aria-label"?: string;
  } & React.HTMLAttributes<HTMLDivElement>;
}

const ProductCard = ({
  slug,
  thumbnail,
  category,
  subcategory,
  productModel,
  variants,
  size,
  ariaAttributes,
}: ProductCardProps) => {
  const { addItem, clearSpecificError, getAddItemLoading, getAddItemError } =
    useCart();

  // Obtener colores únicos de todas las variantes
  const uniqueColors = Array.from(
    new Map(variants.map((v) => [v.color.hex, v.color])).values()
  );

  // Filtrar variantes con stock y encontrar la más barata por priceUSD
  const variantsWithStock = variants.filter((v) => v.stock > 0);
  const cheapestVariant = variantsWithStock.length > 0
    ? variantsWithStock.reduce((min, v) => (v.priceUSD < min.priceUSD ? v : min))
    : variants[0];

  // Estado para el color seleccionado (ninguno al inicio)
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Estado para almacenar aspect-ratio calculado tras carga de la imagen
  const [aspectRatioString, setAspectRatioString] = useState<string | null>(null);

  // Encontrar la variante seleccionada según el color
  const selectedVariant = selectedColor
    ? variants.find((v) => v.color.hex === selectedColor) || null
    : null;

  // Imagen a mostrar: thumbnail si no hay variante seleccionada, si no la de la variante
  const imageToShow = selectedVariant ? selectedVariant.thumbnail : thumbnail;

  const handleAddToCart = async () => {
    if (!selectedVariant || selectedVariant.stock === 0) return;

    // Limpiar errores anteriores del carrito
    clearSpecificError("addItem");

    try {
      const result = await addItem({
        productVariantId: selectedVariant.id,
        quantity: 1,
      });

      // Verificar si el thunk fue exitoso
      if (addItemToCart.fulfilled.match(result)) {
        // Éxito: cerrar SearchDrawer si está abierto y abrir el cart drawer
        searchEvents.closeIfOpen();
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
    <div
      className="card card-border border-[#e1e1e1] bg-white rounded-none"
      {...ariaAttributes}
    >
      <motion.div
        className="card-body"
        whileHover={{
          scale: 1.02,
          y: -2,
          transition: {
            type: "spring",
            stiffness: 180,
            damping: 18,
            mass: 0.7,
          },
        }}
        style={{ transformOrigin: "center" }}
      >
        <Link href={`/producto/${slug}`}>
          <div
            className="relative w-full mb-2 md:h-48"
            style={
              aspectRatioString
                ? ({ aspectRatio: aspectRatioString } as React.CSSProperties)
                : undefined
            }
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/${imageToShow}`}
              alt={productModel}
              fill
              sizes="(max-width: 767px) 100vw, 300px"
              className="object-contain"
              onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                if (naturalWidth && naturalHeight) {
                  // Guardar como "width/height" para setear directamente en CSS aspect-ratio
                  setAspectRatioString(`${naturalWidth}/${naturalHeight}`);
                }
              }}
            />
          </div>
        </Link>
        <div className="flex gap-2 text-xs text-[#888888]">
          {category.map((cat, idx) => (
            <Link
              key={cat.slug}
              href={`/categorias/${encodeURIComponent(cat.slug)}`}
              className="hover:underline"
            >
              {cat.name}
              {idx < category.length - 1 && <span>,</span>}
            </Link>
          ))}
          {subcategory && subcategory.slug && (
            <>
              <span> - </span>
              <Link
                href={`/subcategoria/${encodeURIComponent(subcategory.slug)}`}
                className="hover:underline"
              >
                {subcategory.name}
              </Link>
            </>
          )}
        </div>
        <Link href={`/producto/${slug}`}>
          <h2 className="card-title text-sm font-semibold text-[#111]">
            {productModel}
          </h2>
        </Link>
        {size && <p className="text-xs text-gray-600 font-medium">{size}</p>}
        <p className="text-xs font-bold text-gray-800 flex flex-col md:flex-row items-center md:items-baseline gap-1 md:gap-2">
          USD {(selectedVariant ? selectedVariant.priceUSD : cheapestVariant.priceUSD).toFixed(2)}
          <span className="text-xs text-gray-500 md:before:content-['-'] md:before:mr-2">
            {formatCurrency(
              selectedVariant ? selectedVariant.priceARS : cheapestVariant.priceARS,
              "es-AR",
              "ARS"
            )}{" "}
            pesos
          </span>
        </p>
        <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
          {uniqueColors.map((c) => {
            // Encontrar la variante correspondiente a este color para verificar stock
            const variantForColor = variants.find((v) => v.color.hex === c.hex);
            const isOutOfStock =
              !variantForColor || variantForColor.stock === 0;

            return (
              <button
                key={c.hex}
                type="button"
                className={`flex items-center gap-1 focus:outline-none relative ${
                  isOutOfStock
                    ? "pointer-events-none cursor-not-allowed"
                    : "cursor-pointer"
                }`}
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
                    className={`inline-block w-4 h-4 rounded-full border border-gray-300 relative ${
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
                        <span className="w-5 h-px bg-red-500 rotate-45 transform"></span>
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
        <div className="card-actions justify-center">
          <div
            className={
              selectedVariant && selectedVariant.stock > 0 ? "" : "tooltip"
            }
            data-tip={
              !selectedVariant
                ? "Selecciona un color"
                : selectedVariant?.stock === 0
                ? "Sin stock disponible"
                : undefined
            }
          >
            <button
              className={`btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out ${
                selectedVariant && selectedVariant.stock > 0 && !addLoading
                  ? "bg-[#f2f2f2] text-[#222222] hover:bg-[#000000] hover:text-[#ffffff] cursor-pointer"
                  : "bg-[#e5e5e5] text-[#888888] cursor-not-allowed pointer-events-none"
              }`}
              onClick={
                selectedVariant && selectedVariant.stock > 0 && !addLoading
                  ? handleAddToCart
                  : undefined
              }
            >
              {addLoading ? <LoadingSpinner size="sm" /> : <BagIcon />}
            </button>
          </div>
        </div>

        {/* Error específico para este producto */}
        {addError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs text-center">
            {addError}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProductCard;
