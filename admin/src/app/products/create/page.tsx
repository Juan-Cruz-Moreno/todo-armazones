"use client";

import React, { useEffect, useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import type { CreateProductPayload } from "@/interfaces/product";
import { normalizeColorName } from "@/utils/normalizeColorName";
import { useRouter } from "next/navigation";
import Image from "next/image";

const initialVariant = {
  color: { name: "", hex: "#000000" },
  stock: 0,
  initialCostUSD: 0,
  priceUSD: 0,
};

export default function CreateProductPage() {
  // Cambia addProductWithVariants por createProduct y loading por loading del hook
  const { createProduct, loading } = useProducts();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const [product, setProduct] = useState<CreateProductPayload["product"]>({
    category: [],
    subcategory: "",
    productModel: "",
    sku: "",
    size: "",
  });

  const [variants, setVariants] = useState<
    Array<CreateProductPayload["variants"][number]>
  >([{ ...initialVariant }]);

  // Control de colapsado por variante (default: colapsadas)
  const [expanded, setExpanded] = useState<boolean[]>([false]);

  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [variantImageFiles, setVariantImageFiles] = useState<
    Record<string, File[]>
  >({});

  // Handlers (idénticos al modal)
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (catId: string) => {
    setProduct((prev) => ({
      ...prev,
      category: prev.category.includes(catId)
        ? prev.category.filter((id) => id !== catId)
        : [...prev.category, catId],
    }));
  };

  const handleSubcategoryChange = (subId: string) => {
    setProduct((prev) => ({
      ...prev,
      subcategory: prev.subcategory === subId ? "" : subId,
    }));
  };

  const handleVariantChange = (
    idx: number,
    field: string,
    value: string | number
  ) => {
    // Si cambia el nombre del color, renombramos la key de imágenes asociada
    const renameVariantImageKey = (oldName: string, newName: string) => {
      const oldKey = `images_${normalizeColorName(oldName)}`;
      const newKey = `images_${normalizeColorName(newName)}`;
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
          const oldName = updated[idx].color.name;
          renameVariantImageKey(oldName, value as string);
        }
        updated[idx].color = {
          ...updated[idx].color,
          [colorField]: value as string,
        };
      } else if (field === "stock" || field === "initialCostUSD" || field === "priceUSD") {
        updated[idx][field] = Number(value);
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
    const colorName = normalizeColorName(variants[idx].color.name);
    const files = e.target.files;
    if (files && files.length > 0) {
      setVariantImageFiles((prev) => ({
        ...prev,
        [`images_${colorName}`]: Array.from(files),
      }));
    }
  };

  const addVariant = () =>
    setVariants((prev) => {
      const next = [...prev, { ...initialVariant }];
      setExpanded((prevExp) => [...prevExp, false]);
      return next;
    });
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
    if (!primaryImageFile) {
      alert("Debes seleccionar una imagen principal");
      return;
    }
    
    try {
      await createProduct({
        product,
        variants,
        files: {
          primaryImage: primaryImageFile,
          variantImages: variantImageFiles,
        },
      }).unwrap();

      // Solo se ejecuta si fue exitoso
      setSuccess(true);
      setProduct({
        category: [],
        subcategory: "",
        productModel: "",
        sku: "",
        size: "",
      });
      setVariants([{ ...initialVariant }]);
      setPrimaryImageFile(null);
      setVariantImageFiles({});
    } catch (error) {
      // El error ya se maneja en el estado de Redux
      console.error('Error al crear producto:', error);
    }
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

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 bg-[#f5f5f5] min-h-screen">
      {/* Formulario */}
      <div className="w-full md:w-1/2 bg-[#ffffff] text-[#111111] rounded-none shadow p-4 md:p-8">
        <h2 className="font-bold text-2xl text-center mb-4">Nuevo Producto</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Imagen principal */}
          <label className="text-[#7A7A7A]">Imagen principal</label>
          <input
            className="file-input file-input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            type="file"
            accept="image/*"
            onChange={handlePrimaryImageChange}
            required
          />
          <label className="text-[#7A7A7A]">Categorías</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`btn btn-sm rounded-none ${
                  product.category.includes(cat.id)
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
            {product.category.map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              if (!cat) return null;
              return (
                <span
                  key={cat.id}
                  className="badge badge-neutral rounded-none cursor-pointer"
                  onClick={() =>
                    setProduct((prev) => ({
                      ...prev,
                      category: prev.category.filter((id) => id !== cat.id),
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
                  product.subcategory === sub.id ? "btn-neutral" : "btn-outline"
                }`}
                onClick={() => handleSubcategoryChange(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
          {product.subcategory && (
            <div className="flex flex-wrap gap-2 mb-2">
              {subcategories
                .filter((sub) => sub.id === product.subcategory)
                .map((sub) => (
                  <span
                    key={sub.id}
                    className="badge badge-neutral rounded-none cursor-pointer"
                    onClick={() =>
                      setProduct((prev) => ({
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
            value={product.productModel}
            onChange={handleProductChange}
            required
          />
          <label className="text-[#7A7A7A]">SKU</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            name="sku"
            placeholder="SKU"
            value={product.sku}
            onChange={handleProductChange}
            required
          />
          <label className="text-[#7A7A7A]">Tamaño</label>
          <input
            className="input input-bordered bg-[#FFFFFF] border border-[#e1e1e1]"
            name="size"
            placeholder="Tamaño"
            value={product.size}
            onChange={handleProductChange}
            required
          />
          <div className="divider text-[#7A7A7A]">Variantes</div>
          {variants.map((variant, idx) => (
            <div key={idx} className="border p-2 rounded mb-2 relative">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-left flex-1 flex items-center gap-2"
                  onClick={() => toggleExpand(idx)}
                >
                  <span
                    className="inline-block w-4 h-4 rounded border border-[#e1e1e1]"
                    style={{ background: variant.color.hex }}
                  ></span>
                  <span className="font-medium text-[#222222]">
                    {variant.color.name || "(Sin nombre)"}
                  </span>
                  <span className="text-xs text-[#7A7A7A]">
                    Stock: {variant.stock} · Precio: ${variant.priceUSD}
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
                    value={variant.color.name}
                    onChange={(e) =>
                      handleVariantChange(idx, "color.name", e.target.value)
                    }
                    required
                  />
                  <label className="text-[#7A7A7A]">Color HEX</label>
                  <input
                    className="mb-1 bg-[#FFFFFF] border border-[#e1e1e1] rounded"
                    type="color"
                    value={variant.color.hex}
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
                  <label className="text-[#7A7A7A]">Stock</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    placeholder="Stock"
                    value={variant.stock}
                    onChange={(e) =>
                      handleVariantChange(idx, "stock", e.target.value)
                    }
                    required
                  />
                  <label className="text-[#7A7A7A]">Costo inicial USD</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    placeholder="Costo inicial USD"
                    value={variant.initialCostUSD}
                    onChange={(e) =>
                      handleVariantChange(idx, "initialCostUSD", e.target.value)
                    }
                    required
                  />
                  <label className="text-[#7A7A7A]">Precio USD</label>
                  <input
                    className="input input-bordered mb-1 bg-[#FFFFFF] border border-[#e1e1e1]"
                    type="number"
                    placeholder="Precio USD"
                    value={variant.priceUSD}
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
                    required
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
          {primaryImageFile ? (
            <Image
              src={URL.createObjectURL(primaryImageFile)}
              alt="Imagen principal"
              width={300}
              height={300}
              className="rounded border border-[#e1e1e1] bg-[#FFFFFF]"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded text-gray-400 border border-[#e1e1e1]">
              Sin imagen
            </div>
          )}
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Modelo:</span>
          <span className="ml-2">{product.productModel}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">SKU:</span>
          <span className="ml-2">{product.sku}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Tamaño:</span>
          <span className="ml-2">{product.size}</span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Categorías:</span>
          <span className="ml-2">
            {product.category
              .map((catId) => categories.find((c) => c.id === catId)?.name)
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Subcategoría:</span>
          <span className="ml-2">
            {subcategories.find((s) => s.id === product.subcategory)?.name ||
              ""}
          </span>
        </div>
        <div className="mb-2 w-full">
          <span className="font-semibold text-[#7A7A7A]">Variantes:</span>
          <ul className="mt-2">
            {variants.map((v, i) => (
              <li
                key={i}
                className="flex items-center gap-2 border border-[#e1e1e1] rounded mb-1 px-2 py-1 bg-[#fafafa]"
              >
                <span
                  className="inline-block w-4 h-4 rounded border border-[#e1e1e1]"
                  style={{ background: v.color.hex }}
                ></span>
                <span className="text-[#222222]">{v.color.name}</span>
                <span className="text-[#7A7A7A]">(Stock: {v.stock}, Costo: ${v.initialCostUSD}, Precio: ${v.priceUSD})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <dialog id="product_success_modal" className="modal" ref={modalRef}>
        <div className="modal-box bg-white text-[#111111] rounded-none">
          <h3 className="font-bold text-lg">¡Producto creado con éxito!</h3>
          <p className="py-4">
            El producto fue creado correctamente. Puedes ver todos los productos
            en la sección de productos.
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
