"use client";

import React, { useEffect, useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import type { UpdateProductPayload } from "@/interfaces/product";
import { normalizeColorName } from "@/utils/normalizeColorName";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatCurrency } from "@/utils/formatCurrency";

const initialVariant = {
  id: "",
  data: {
    color: { name: "", hex: "" },
    priceUSD: 0,
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

  const [formProduct, setFormProduct] = useState<
    UpdateProductPayload["product"]
  >(() => {
    if (!product)
      return {
        category: [],
        subcategory: "",
        productModel: "",
        sku: "",
        size: "",
        description: "",
      };
    return {
      category: product.category.map((cat) => cat.id),
      subcategory: product.subcategory.id,
      productModel: product.productModel,
      sku: product.sku,
      size: product.size,
      description: product.description || "",
    };
  });

  const [variants, setVariants] = useState<
    Array<{
      id: string;
      data: {
        color: { name: string; hex: string };
        priceUSD?: number;
        images?: string[];
      };
    }>
  >(() =>
    product
      ? product.variants.map((v) => ({
          id: v.id,
          data: {
            color: { ...v.color },
            priceUSD: v.priceUSD,
            images: v.images,
          },
        }))
      : [{ ...initialVariant }]
  );

  // Control de colapsado por variante (default: colapsadas)
  const [expanded, setExpanded] = useState<boolean[]>(
    () => (product ? product.variants.map(() => false) : [false])
  );

  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [variantImageFiles, setVariantImageFiles] = useState<
    Record<string, File[]>
  >({});

  // Handlers (igual que antes)
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (catId: string) => {
    setFormProduct((prev) => ({
      ...prev,
      category: prev.category?.includes(catId)
        ? prev.category.filter((id) => id !== catId)
        : [...(prev.category || []), catId],
    }));
  };

  const handleSubcategoryChange = (subId: string) => {
    setFormProduct((prev) => ({
      ...prev,
      subcategory: prev.subcategory === subId ? "" : subId,
    }));
  };

  const handleVariantChange = (
    idx: number,
    field: string,
    value: string | number
  ) => {
    // Si cambia el nombre del color, renombramos la key de imágenes asociada en variantImageFiles
    const renameVariantImageKey = (oldName: string, newName: string) => {
      const oldKey = normalizeColorName(oldName);
      const newKey = normalizeColorName(newName);
      if (oldKey === newKey) return;
      setVariantImageFiles((prev) => {
        const next = { ...prev } as Record<string, File[]>;
        if (next[oldKey]) {
          next[newKey] = next[newKey] ? [...next[newKey], ...next[oldKey]] : next[oldKey];
          delete next[oldKey];
        }
        return next;
      });
    };

    setVariants((prev) => {
      const updated = [...prev];
      if (field.startsWith("color.")) {
        const colorField = field.split(".")[1] as "name" | "hex";
        if (colorField === "name") {
          const oldName = updated[idx].data.color.name;
          renameVariantImageKey(oldName, value as string);
        }
        updated[idx].data.color = {
          ...updated[idx].data.color,
          [colorField]: value as string,
        };
      } else if (field === "priceUSD") {
        updated[idx].data.priceUSD = Number(value);
      }
      return updated;
    });
  };

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0])
      setPrimaryImageFile(e.target.files[0]);
  };

  const handleVariantImagesChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const colorName = normalizeColorName(variants[idx].data.color.name);
    const files = e.target.files;
    if (files && files.length > 0) {
      setVariantImageFiles((prev) => ({
        ...prev,
        [colorName]: Array.from(files),
      }));
    }
  };

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      {
        id: "",
        data: { color: { name: "", hex: "" }, priceUSD: 0 },
      },
    ]);
  const removeVariant = (idx: number) =>
    setVariants((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setExpanded((prevExp) => prevExp.filter((_, i) => i !== idx));
      return next;
    });

  const toggleExpand = (idx: number) =>
    setExpanded((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    await updateProduct({
      productId: product.id,
      product: formProduct,
      variants,
      files: {
        ...(primaryImageFile ? { primaryImage: primaryImageFile } : {}),
        variantImages: variantImageFiles,
      },
    });
    setSuccess(true);
  };

  useEffect(() => {
    if (success && modalRef.current) {
      modalRef.current.showModal();
    }
  }, [success]);

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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Imagen principal */}
          <label className="text-[#7A7A7A]">Imagen principal</label>
          <input
            className="file-input file-input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            type="file"
            accept="image/*"
            onChange={handlePrimaryImageChange}
          />
          <label className="text-[#7A7A7A]">Categorías</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`btn btn-sm rounded-none ${
                  formProduct.category?.includes(cat.id)
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
            {formProduct.category?.map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              if (!cat) return null;
              return (
                <span
                  key={cat.id}
                  className="badge badge-neutral rounded-none cursor-pointer"
                  onClick={() =>
                    setFormProduct((prev) => ({
                      ...prev,
                      category: prev.category?.filter((id) => id !== cat.id),
                    }))
                  }
                  title="Quitar"
                >
                  {cat.name} ✕
                </span>
              );
            })}
          </div>
          <label className="text-[#7A7A7A]">Subcategoría</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {subcategories.map((sub) => (
              <button
                type="button"
                key={sub.id}
                className={`btn btn-sm rounded-none ${
                  formProduct.subcategory === sub.id
                    ? "btn-neutral"
                    : "btn-outline"
                }`}
                onClick={() => handleSubcategoryChange(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
          {formProduct.subcategory && (
            <div className="flex flex-wrap gap-2 mb-2">
              {subcategories
                .filter((sub) => sub.id === formProduct.subcategory)
                .map((sub) => (
                  <span
                    key={sub.id}
                    className="badge badge-neutral rounded-none cursor-pointer"
                    onClick={() =>
                      setFormProduct((prev) => ({
                        ...prev,
                        subcategory: "",
                      }))
                    }
                    title="Quitar"
                  >
                    {sub.name} ✕
                  </span>
                ))}
            </div>
          )}
          <label className="text-[#7A7A7A]">Modelo</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            name="productModel"
            placeholder="Modelo"
            value={formProduct.productModel || ""}
            onChange={handleProductChange}
            required
          />
          <label className="text-[#7A7A7A]">SKU</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            name="sku"
            placeholder="SKU"
            value={formProduct.sku || ""}
            onChange={handleProductChange}
            required
          />
          <label className="text-[#7A7A7A]">Calibre</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            name="size"
            placeholder="Calibre"
            value={formProduct.size || ""}
            onChange={handleProductChange}
            required
          />
          <label className="text-[#7A7A7A]">Descripción (opcional)</label>
          <textarea
            className="textarea textarea-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            name="description"
            placeholder="Descripción del producto"
            value={formProduct.description || ""}
            onChange={handleProductChange}
            rows={3}
          />
          <div className="divider text-[#7A7A7A]">Variantes</div>
          {variants.map((variant, idx) => (
            <div
              key={variant.id || idx}
              className="border p-2 rounded mb-2 relative"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-left flex-1 flex items-center gap-2"
                  onClick={() => toggleExpand(idx)}
                >
                  <span
                    className="inline-block w-4 h-4 rounded border border-[#e1e1e1]"
                    style={{ background: variant.data.color.hex }}
                  ></span>
                  <span className="font-medium text-[#222222]">
                    {variant.data.color.name || "(Sin nombre)"}
                  </span>
                  <span className="text-xs text-[#7A7A7A]">
                    Precio: {formatCurrency(variant.data.priceUSD || 0)}
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
                    disabled={variants.length === 1}
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
                    value={variant.data.color.name}
                    onChange={(e) =>
                      handleVariantChange(idx, "color.name", e.target.value)
                    }
                    required
                  />
                  <label className="text-[#7A7A7A]">Color HEX</label>
                  <input
                    className="mb-1 bg-[#FFFFFF] border border-[#e1e1e1] rounded"
                    type="color"
                    value={variant.data.color.hex}
                    onChange={(e) =>
                      handleVariantChange(idx, "color.hex", e.target.value)
                    }
                    required
                    style={{
                      width: "48px",
                      height: "32px",
                      padding: 0,
                      border: "1px solid #e1e1e1",
                    }}
                  />
                  <label className="text-[#7A7A7A]">Precio USD</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    placeholder="Precio USD"
                    value={variant.data.priceUSD || ""}
                    onChange={(e) =>
                      handleVariantChange(idx, "priceUSD", e.target.value)
                    }
                    required
                  />
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
          {primaryImageFile ? (
            <Image
              src={URL.createObjectURL(primaryImageFile)}
              alt="Imagen principal"
              width={300}
              height={300}
              className="rounded border border-[#e1e1e1] bg-[#FFFFFF]"
            />
          ) : (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/${product.thumbnail}`}
              alt="Imagen principal"
              width={300}
              height={300}
              className="rounded border border-[#e1e1e1] bg-[#FFFFFF]"
            />
          )}
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Modelo:</span>
          <span className="ml-2">{formProduct.productModel}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">SKU:</span>
          <span className="ml-2">{formProduct.sku}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Tamaño:</span>
          <span className="ml-2">{formProduct.size}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Descripción:</span>
          <span className="ml-2">{formProduct.description || "No especificada"}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Categorías:</span>
          <span className="ml-2">
            {formProduct.category
              ?.map((catId) => categories.find((c) => c.id === catId)?.name)
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Subcategoría:</span>
          <span className="ml-2">
            {subcategories.find((s) => s.id === formProduct.subcategory)
              ?.name || ""}
          </span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Variantes:</span>
          <ul className="mt-2">
            {variants.map((v, i) => (
              <li
                key={v.id || i}
                className="flex items-center gap-2 border border-[#e1e1e1] rounded mb-1 px-2 py-1 bg-[#fafafa]"
              >
                <span
                  className="inline-block w-4 h-4 rounded border border-[#e1e1e1]"
                  style={{ background: v.data.color.hex }}
                ></span>
                <span className="text-[#222222]">{v.data.color.name}</span>
                <span className="text-[#7A7A7A]">
                  (Precio: {formatCurrency(v.data.priceUSD || 0)})
                </span>
              </li>
            ))}
          </ul>
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
