"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProducts } from "@/hooks/useProducts";
import { normalizeColorName } from "@/utils/normalizeColorName";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createProductWithVariantsFrontendSchema,
  type CreateProductFormData,
} from "@/schemas/product.schema";
import { getErrorMessage } from "@/types/api";

const initialVariant = {
  color: { name: "", hex: "" },
  stock: undefined,
  initialCostUSD: undefined,
  priceUSD: undefined,
};

export default function CreateProductPage() {
  // Cambia addProductWithVariants por createProduct y loading por loading del hook
  const { createProduct, loading, lastCreatedProduct } = useProducts();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  // Control de colapsado por variante (default: colapsadas)
  const [expanded, setExpanded] = useState<boolean[]>([false]);

  // Estado para manejar errores en toast
  const [toastErrors, setToastErrors] = useState<
    {
      id: string;
      message: string;
      type: "error" | "success" | "warning";
      timestamp: number;
    }[]
  >([]);

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductWithVariantsFrontendSchema),
    defaultValues: {
      product: {
        category: [],
        subcategory: "",
        productModel: "",
        sku: "",
        size: "",
        description: "",
      },
      variants: [{ ...initialVariant }],
      files: {
        primaryImage: undefined as unknown as File,
        variantImages: {},
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const watchedProduct = watch("product");
  const watchedVariants = watch("variants");
  const watchedPrimaryImage = watch("files.primaryImage");
  const watchedVariantImages = watch("files.variantImages");

  // Funciones helper para manejar errores en toast
  const addToastError = (
    message: string,
    type: "error" | "success" | "warning" = "error"
  ) => {
    const newError = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now(),
    };
    setToastErrors((prev) => [...prev, newError]);

    // Auto-remover después de 5 segundos para success y warning, 8 segundos para error
    setTimeout(
      () => {
        removeToastError(newError.id);
      },
      type === "error" ? 8000 : 5000
    );
  };

  const removeToastError = (id: string) => {
    setToastErrors((prev) => prev.filter((err) => err.id !== id));
  };

  const addSuccess = (message: string) => addToastError(message, "success");
  const addWarning = (message: string) => addToastError(message, "warning");

  // Handlers para categorías y subcategorías
  const handleCategoryChange = (catId: string) => {
    const currentCategories = watchedProduct.category || [];
    const newCategories = currentCategories.includes(catId)
      ? currentCategories.filter((id) => id !== catId)
      : [...currentCategories, catId];
    setValue("product.category", newCategories);
    trigger("product.category");
  };

  const handleSubcategoryChange = (subId: string) => {
    const currentSubcategory = watchedProduct.subcategory;
    setValue("product.subcategory", currentSubcategory === subId ? "" : subId);
    trigger("product.subcategory");
  };

  // Handler para imágenes de variante
  const handleVariantImagesChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const colorName = normalizeColorName(
      watchedVariants[idx]?.color?.name || ""
    );
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentVariantImages = watch("files.variantImages") || {};
      setValue("files.variantImages", {
        ...currentVariantImages,
        [`images_${colorName}`]: Array.from(files),
      });
      trigger("files.variantImages");
    }
  };

  const addVariant = () => {
    append({ ...initialVariant });
    setExpanded((prev) => [...prev, false]);
  };

  const removeVariant = (idx: number) => {
    remove(idx);
    setExpanded((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleExpand = (idx: number) =>
    setExpanded((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  const onSubmit = async (data: CreateProductFormData) => {
    // Mapear undefined a 0 para stock, initialCostUSD y priceUSD
    const mappedData = {
      ...data,
      variants: data.variants.map((variant) => ({
        ...variant,
        stock: variant.stock ?? 0,
        initialCostUSD: variant.initialCostUSD ?? 0,
        priceUSD: variant.priceUSD ?? 0,
      })),
    };

    try {
      await createProduct({
        product: mappedData.product,
        variants: mappedData.variants,
        files: mappedData.files,
      }).unwrap();

      addSuccess("Producto creado exitosamente.");
      setSuccess(true);
      // Reset form completamente
      reset();
      setExpanded([false]);
    } catch (error) {
      console.error("Error al crear producto:", error);
      // Mostrar error en toast
      const errorMessage = typeof error === 'string' ? error : getErrorMessage(error);
      addToastError(errorMessage);
    }
  };

  useEffect(() => {
    if (success && modalRef.current) {
      modalRef.current.showModal();
    }
  }, [success]);

  // Expandir variantes con errores
  useEffect(() => {
    if (errors.variants && Array.isArray(errors.variants)) {
      setExpanded((prev) =>
        prev.map((exp, idx) => exp || !!errors.variants![idx])
      );
    }
  }, [errors.variants]);

  const closeModalAndGo = () => {
    modalRef.current?.close();
    router.push("/products");
  };

  const continueCreating = () => {
    modalRef.current?.close();
    setSuccess(false);
  };

  // Categorías y subcategorías (puedes extraerlas a constantes)
  const categories = [
    { id: "687817781dd5819a2483c7eb", name: "Hombres" },
    { id: "6878179f1dd5819a2483c7ed", name: "Mujeres" },
    { id: "687817d71dd5819a2483c7ef", name: "Niños" },
  ];
  const subcategories = [
    { id: "687819d2cdda2752c527177b", name: "Anteojos de sol" },
    { id: "6878196acdda2752c5271779", name: "Armazón de receta" },
    { id: "68781a06cdda2752c527177d", name: "Clip on" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 bg-[#f5f5f5] min-h-screen">
      {/* Formulario */}
      <div className="w-full md:w-1/2 bg-[#ffffff] text-[#111111] rounded-none shadow p-4 md:p-8">
        <h2 className="font-bold text-2xl text-center mb-4">Nuevo Producto</h2>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {/* Imagen principal */}
          <label className="text-[#7A7A7A]">Imagen principal</label>
          <input
            className="file-input file-input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            type="file"
            accept="image/*"
            onChange={(e) => {
              setValue(
                "files.primaryImage",
                e.target.files?.[0] || (undefined as unknown as File)
              );
              trigger("files.primaryImage");
            }}
            required
          />
          {errors.files?.primaryImage && (
            <p className="text-red-500 text-sm">
              {errors.files.primaryImage.message}
            </p>
          )}
          <label className="text-[#7A7A7A]">Categorías</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`btn btn-sm rounded-none ${
                  watchedProduct.category?.includes(cat.id)
                    ? "btn-neutral"
                    : "btn-outline"
                }`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {/* Badges de categorías seleccionadas */}
          <div className="flex flex-wrap gap-2 mb-2">
            {watchedProduct.category?.map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              if (!cat) return null;
              return (
                <span
                  key={cat.id}
                  className="badge badge-neutral rounded-none cursor-pointer"
                  onClick={() => handleCategoryChange(cat.id)}
                  title="Quitar"
                >
                  {cat.name} ✕
                </span>
              );
            })}
          </div>
          {errors.product?.category && (
            <p className="text-red-500 text-sm">
              {errors.product.category.message}
            </p>
          )}
          <label className="text-[#7A7A7A]">Subcategoría</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {subcategories.map((sub) => (
              <button
                type="button"
                key={sub.id}
                className={`btn btn-sm rounded-none ${
                  watchedProduct.subcategory === sub.id
                    ? "btn-neutral"
                    : "btn-outline"
                }`}
                onClick={() => handleSubcategoryChange(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
          {watchedProduct.subcategory && (
            <div className="flex flex-wrap gap-2 mb-2">
              {subcategories
                .filter((sub) => sub.id === watchedProduct.subcategory)
                .map((sub) => (
                  <span
                    key={sub.id}
                    className="badge badge-neutral rounded-none cursor-pointer"
                    onClick={() => handleSubcategoryChange(sub.id)}
                    title="Quitar"
                  >
                    {sub.name} ✕
                  </span>
                ))}
            </div>
          )}
          {errors.product?.subcategory && (
            <p className="text-red-500 text-sm">
              {errors.product.subcategory.message}
            </p>
          )}
          <label className="text-[#7A7A7A]">Modelo</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            placeholder="Modelo"
            {...register("product.productModel")}
            required
          />
          {errors.product?.productModel && (
            <p className="text-red-500 text-sm">
              {errors.product.productModel.message}
            </p>
          )}
          <label className="text-[#7A7A7A]">SKU</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            placeholder="SKU"
            {...register("product.sku")}
            required
          />
          {errors.product?.sku && (
            <p className="text-red-500 text-sm">{errors.product.sku.message}</p>
          )}
          <label className="text-[#7A7A7A]">Calibre</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            placeholder="Calibre"
            {...register("product.size")}
            required
          />
          {errors.product?.size && (
            <p className="text-red-500 text-sm">
              {errors.product.size.message}
            </p>
          )}
          <label className="text-[#7A7A7A]">Descripción (opcional)</label>
          <textarea
            className="textarea textarea-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            placeholder="Descripción del producto"
            {...register("product.description")}
            rows={3}
          />
          {errors.product?.description && (
            <p className="text-red-500 text-sm">
              {errors.product.description.message}
            </p>
          )}
          <div className="divider text-[#7A7A7A]">Variantes</div>
          {errors.variants?.message && (
            <p className="text-red-500 text-sm">{errors.variants.message}</p>
          )}
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="border p-2 rounded-none mb-2 relative"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-left flex-1 flex items-center gap-2"
                  onClick={() => toggleExpand(idx)}
                >
                  <span
                    className="inline-block w-4 h-4 rounded border border-[#e1e1e1]"
                    style={{
                      background: watchedVariants[idx]?.color?.hex || "#000000",
                    }}
                  ></span>
                  <span className="font-medium text-[#222222]">
                    {watchedVariants[idx]?.color?.name || "(Sin nombre)"}
                  </span>
                  <span className="text-xs text-[#7A7A7A]">
                    Stock: {watchedVariants[idx]?.stock || 0} · Precio: $
                    {watchedVariants[idx]?.priceUSD || 0}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => toggleExpand(idx)}
                    title={expanded[idx] ? "Colapsar" : "Expandir"}
                  >
                    {expanded[idx] ? "▾" : "▸"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-error"
                    onClick={() => removeVariant(idx)}
                    disabled={fields.length === 1}
                    tabIndex={-1}
                    title="Eliminar variante"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {expanded[idx] && (
                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[#7A7A7A]">Color nombre</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    placeholder="Color nombre"
                    {...register(`variants.${idx}.color.name`)}
                    required
                  />
                  {errors.variants?.[idx]?.color?.name && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].color.name.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Color HEX</label>
                  <input
                    className="mb-1 bg-[#FFFFFF] border border-[#e1e1e1] rounded-none"
                    type="color"
                    {...register(`variants.${idx}.color.hex`)}
                    required
                    style={{
                      width: "48px",
                      height: "32px",
                      padding: 0,
                      border: "1px solid #e1e1e1",
                    }}
                  />
                  {errors.variants?.[idx]?.color?.hex && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].color.hex.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Stock</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    placeholder="Stock"
                    {...register(`variants.${idx}.stock`, {
                      valueAsNumber: true,
                    })}
                    required
                  />
                  {errors.variants?.[idx]?.stock && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].stock.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Costo inicial USD</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    placeholder="Costo inicial USD"
                    {...register(`variants.${idx}.initialCostUSD`, {
                      valueAsNumber: true,
                    })}
                    required
                  />
                  {errors.variants?.[idx]?.initialCostUSD && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].initialCostUSD.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Precio USD</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    placeholder="Precio USD"
                    {...register(`variants.${idx}.priceUSD`, {
                      valueAsNumber: true,
                    })}
                    required
                  />
                  {errors.variants?.[idx]?.priceUSD && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].priceUSD.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Imágenes de variante</label>
                  <input
                    className="file-input file-input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleVariantImagesChange(idx, e)}
                    required
                  />
                  {errors.files?.variantImages && (
                    <p className="text-red-500 text-sm">
                      {String(errors.files.variantImages.message)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={addVariant}
          >
            + Agregar variante
          </button>
          <button
            type="submit"
            className="btn rounded-none bg-[#222222] text-[#ffffff] border border-[#e1e1e1] shadow-none mt-2 btn-primary"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear producto"}
          </button>
        </form>
      </div>
      {/* Vista previa */}
      <div className="w-full md:w-1/2 bg-[#ffffff] text-[#111111] rounded-none shadow p-4 md:p-8 flex flex-col items-center">
        <h3 className="font-bold text-lg text-center mb-4">Vista previa</h3>
        {/* Imagen principal */}
        <label className="text-[#7A7A7A]">Imagen principal</label>
        <div className="mb-4">
          {watchedPrimaryImage && watchedPrimaryImage instanceof File ? (
            <Image
              src={URL.createObjectURL(watchedPrimaryImage)}
              alt="Imagen principal"
              width={300}
              height={300}
              className="rounded-none border border-[#e1e1e1] bg-[#FFFFFF]"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-none text-gray-400 border border-[#e1e1e1]">
              Sin imagen
            </div>
          )}
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Modelo:</span>
          <span className="ml-2">{watchedProduct.productModel || ""}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">SKU:</span>
          <span className="ml-2">{watchedProduct.sku || ""}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Tamaño:</span>
          <span className="ml-2">{watchedProduct.size || ""}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Descripción:</span>
          <span className="ml-2">
            {watchedProduct.description || "No especificada"}
          </span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Categorías:</span>
          <span className="ml-2">
            {watchedProduct.category
              ?.map((catId) => categories.find((c) => c.id === catId)?.name)
              .filter(Boolean)
              .join(", ") || ""}
          </span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Subcategoría:</span>
          <span className="ml-2">
            {subcategories.find((s) => s.id === watchedProduct.subcategory)
              ?.name || ""}
          </span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Variantes:</span>
          <ul className="mt-2">
            {watchedVariants?.map((v, i) => (
              <li
                key={i}
                className="flex items-center gap-2 border border-[#e1e1e1] rounded-none mb-1 px-2 py-1 bg-[#fafafa]"
              >
                <span
                  className="inline-block w-4 h-4 rounded border border-[#e1e1e1]"
                  style={{ background: v?.color?.hex || "#000000" }}
                ></span>
                <span className="text-[#222222]">{v?.color?.name || ""}</span>
                <span className="text-[#7A7A7A]">
                  (Stock: {v?.stock || 0}, Costo: ${v?.initialCostUSD || 0},
                  Precio: ${v?.priceUSD || 0})
                </span>
              </li>
            )) || []}
          </ul>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">
            Imágenes de Variantes:
          </span>
          <div className="mt-2">
            {watchedVariants?.map((v, i) => {
              const normalizedKey = `images_${normalizeColorName(
                v?.color?.name || ""
              )}`;
              const images = watchedVariantImages?.[normalizedKey];
              if (!images || images.length === 0) return null;
              return (
                <div key={i} className="mb-4">
                  <span className="text-[#222222] font-medium">
                    {v?.color?.name || "Sin nombre"}:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {images.map((file, j) => (
                      <Image
                        key={j}
                        src={URL.createObjectURL(file)}
                        alt={`Imagen ${j + 1} de ${v?.color?.name}`}
                        width={100}
                        height={100}
                        className="rounded-none border border-[#e1e1e1]"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <dialog id="product_success_modal" className="modal" ref={modalRef}>
        <div className="modal-box bg-white text-[#111111] rounded-none">
          <h3 className="font-bold text-lg">¡Producto creado con éxito!</h3>
          <p className="py-4">
            El producto fue creado correctamente. Puedes ver todos los productos
            en la sección de productos.
          </p>
          <div className="modal-action flex flex-col gap-2">
            <button
              className="btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 w-full"
              onClick={continueCreating}
            >
              Continuar creando productos
            </button>
            {lastCreatedProduct && (
              <button
                className="btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 w-full btn-secondary"
                onClick={() =>
                  router.push(`/products/edit/${lastCreatedProduct.id}`)
                }
              >
                Editar producto
              </button>
            )}
            <button
              className="btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 w-full"
              onClick={closeModalAndGo}
            >
              Ir a productos
            </button>
          </div>
        </div>
      </dialog>

      {/* Toasts de errores */}
      <div className="toast toast-top toast-end z-50">
        {toastErrors.map((err) => (
          <div
            key={err.id}
            className={`alert ${
              err.type === "error"
                ? "alert-error"
                : err.type === "success"
                ? "alert-success"
                : "alert-warning"
            }`}
          >
            <span>{err.message}</span>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => removeToastError(err.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
