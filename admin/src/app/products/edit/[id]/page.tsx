"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProducts } from "@/hooks/useProducts";
import {
  updateProductWithVariantsFrontendSchema,
  UpdateProductFormData,
} from "@/schemas/product.schema";
import { normalizeColorName } from "@/utils/normalizeColorName";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatCurrency } from "@/utils/formatCurrency";

const initialVariant = {
  id: "",
  data: {
    color: { name: "", hex: "" },
    priceUSD: 0,
    averageCostUSD: 0,
  },
};

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Desempaqueta params usando React.use()
  const { id } = React.use(params);
  const { products, searchResults, updateProduct, loading } = useProducts();
  const router = useRouter();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [success, setSuccess] = useState(false);

  // Busca el producto por id usando params.id
  const product =
    products.find((p) => p.id === id) || searchResults.find((p) => p.id === id);

  useEffect(() => {
    if (!product && products.length > 0) {
      router.push("/products");
    }
  }, [product, products, router]);

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<UpdateProductFormData>({
    resolver: zodResolver(updateProductWithVariantsFrontendSchema),
    defaultValues: product
      ? {
          productId: product.id,
          product: {
            category: product.category.map((cat) => cat.id),
            subcategory: product.subcategory.id,
            productModel: product.productModel,
            sku: product.sku,
            size: product.size,
            description: product.description || "",
          },
          variants: product.variants.map((v) => ({
            id: v.id,
            data: {
              color: { ...v.color },
              priceUSD: v.priceUSD,
              averageCostUSD: v.averageCostUSD,
            },
          })),
          files: {
            primaryImage: undefined as unknown as File,
            variantImages: {},
          },
        }
      : {
          productId: "",
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

  // Control de colapsado por variante (default: colapsadas)
  const [expanded, setExpanded] = useState<boolean[]>(() =>
    product ? product.variants.map(() => false) : [false]
  );

  const watchedProduct = watch("product");
  const watchedVariants = watch("variants");
  const watchedPrimaryImage = watch("files.primaryImage");
  const watchedVariantImages = watch("files.variantImages");

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
      watchedVariants?.[idx]?.data?.color?.name || ""
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

  const onSubmit = async (data: UpdateProductFormData) => {
    if (!product) return;
    try {
      const updatedProduct = await updateProduct({
        productId: data.productId,
        product: data.product,
        variants: data.variants || [],
        files: data.files,
      }).unwrap();
      setSuccess(true);
      // Reset form to updated product values (from backend response)
      setValue("product", {
        category: updatedProduct.category.map((cat) => cat.id),
        subcategory: updatedProduct.subcategory.id,
        productModel: updatedProduct.productModel,
        sku: updatedProduct.sku,
        size: updatedProduct.size,
        description: updatedProduct.description || "",
      });
      setValue(
        "variants",
        updatedProduct.variants.map((v) => ({
          id: v.id,
          data: {
            color: { ...v.color },
            priceUSD: v.priceUSD,
            averageCostUSD: v.averageCostUSD,
          },
        }))
      );
      setValue("files", {
        primaryImage: undefined as unknown as File,
        variantImages: {},
      });
      setExpanded(updatedProduct.variants.map(() => false));
    } catch (error) {
      console.error("Error al actualizar producto:", error);
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

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-gray-500">Cargando producto...</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 bg-[#f5f5f5] min-h-screen">
      {/* Formulario */}
      <div className="w-full md:w-1/2 bg-[#ffffff] text-[#111111] rounded-none shadow p-4 md:p-8">
        <h2 className="font-bold text-2xl text-center mb-4">Editar Producto</h2>
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
          />
          {errors.product?.sku && (
            <p className="text-red-500 text-sm">{errors.product.sku.message}</p>
          )}
          <label className="text-[#7A7A7A]">Calibre</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            placeholder="Calibre"
            {...register("product.size")}
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
                      background: watchedVariants?.[idx]?.data?.color?.hex,
                    }}
                  ></span>
                  <span className="font-medium text-[#222222]">
                    {watchedVariants?.[idx]?.data?.color?.name ||
                      "(Sin nombre)"}
                  </span>
                  <span className="text-xs text-[#7A7A7A]">
                    Precio:{" "}
                    {formatCurrency(
                      watchedVariants?.[idx]?.data?.priceUSD || 0
                    )}{" "}
                    | Costo:{" "}
                    {formatCurrency(
                      watchedVariants?.[idx]?.data?.averageCostUSD || 0
                    )}
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
                  <input type="hidden" {...register(`variants.${idx}.id`)} />
                  <label className="text-[#7A7A7A]">Color nombre</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    placeholder="Color nombre"
                    {...register(`variants.${idx}.data.color.name`)}
                  />
                  {errors.variants?.[idx]?.data?.color?.name && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].data.color.name.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Color HEX</label>
                  <input
                    className="mb-1 bg-[#FFFFFF] border border-[#e1e1e1] rounded"
                    type="color"
                    {...register(`variants.${idx}.data.color.hex`)}
                    style={{
                      width: "48px",
                      height: "32px",
                      padding: 0,
                      border: "1px solid #e1e1e1",
                    }}
                  />
                  {errors.variants?.[idx]?.data?.color?.hex && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].data.color.hex.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Precio USD</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    placeholder="Precio USD"
                    {...register(`variants.${idx}.data.priceUSD`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.variants?.[idx]?.data?.priceUSD && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].data.priceUSD.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Costo Promedio USD</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    step="0.01"
                    placeholder="Costo Promedio USD"
                    {...register(`variants.${idx}.data.averageCostUSD`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.variants?.[idx]?.data?.averageCostUSD && (
                    <p className="text-red-500 text-sm">
                      {errors.variants[idx].data.averageCostUSD.message}
                    </p>
                  )}
                  <label className="text-[#7A7A7A]">Imágenes de variante</label>
                  <input
                    className="file-input file-input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleVariantImagesChange(idx, e)}
                  />
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
            {loading ? "Guardando..." : "Guardar cambios"}
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
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/${product.primaryImage}`}
              alt="Imagen principal"
              width={300}
              height={300}
              className="rounded-none border border-[#e1e1e1] bg-[#FFFFFF]"
            />
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
            {(watchedVariants || []).map((v, i) => (
              <li
                key={i}
                className="flex items-center gap-2 border border-[#e1e1e1] rounded mb-1 px-2 py-1 bg-[#fafafa]"
              >
                <span
                  className="inline-block w-4 h-4 rounded border border-[#e1e1e1]"
                  style={{ background: v?.data?.color?.hex }}
                ></span>
                <span className="text-[#222222]">{v?.data?.color?.name}</span>
                <span className="text-[#7A7A7A]">
                  (Precio: {formatCurrency(v?.data?.priceUSD || 0)} | Costo:{" "}
                  {formatCurrency(v?.data?.averageCostUSD || 0)})
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">
            Imágenes de Variantes:
          </span>
          <div className="mt-2">
            {/* Imágenes actuales de las variantes */}
            {product.variants.map((variant) => (
              <div key={`current-${variant.id}`} className="mb-4">
                <span className="text-sm text-[#7A7A7A] font-medium">
                  {variant.color.name} (actuales):
                </span>
                {variant.images && variant.images.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {variant.images.map((imageUrl, j) => (
                      <Image
                        key={`current-${j}`}
                        src={`${process.env.NEXT_PUBLIC_API_URL}/${imageUrl}`}
                        alt={`Imagen actual ${j + 1} de ${variant.color.name}`}
                        width={100}
                        height={100}
                        className="rounded-none border border-[#e1e1e1]"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Sin imágenes actuales
                  </p>
                )}
              </div>
            ))}
            {/* Nuevas imágenes subidas */}
            {Object.entries(watchedVariantImages || {}).map(([key, files]) => (
              <div key={`new-${key}`} className="mb-4">
                <span className="text-sm text-[#7A7A7A] font-medium">
                  {key.replace("images_", "")} (nuevas):
                </span>
                <div className="flex gap-2 mt-1">
                  {files.map((file, idx) => (
                    <Image
                      key={`new-${idx}`}
                      src={URL.createObjectURL(file)}
                      alt={`Nueva imagen ${idx + 1} de ${key.replace(
                        "images_",
                        ""
                      )}`}
                      width={100}
                      height={100}
                      className="rounded-none border border-[#e1e1e1]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <dialog id="edit_product_success_modal" className="modal" ref={modalRef}>
        <div className="modal-box bg-white text-[#111111] rounded-none">
          <h3 className="font-bold text-lg">
            ¡Producto actualizado con éxito!
          </h3>
          <p className="py-4">
            El producto fue actualizado correctamente. Puedes ver todos los
            productos en la sección de productos.
          </p>
          <div className="modal-action">
            <button
              className="btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 w-full"
              onClick={closeModalAndGo}
            >
              Ir a productos
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
