"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  {
    name: "Hombres",
    slug: "hombres",
    subcategories: [
      { name: "Anteojos de sol", slug: "anteojos-de-sol-polarizados" },
      { name: "Armazón de receta", slug: "armazon-de-receta" },
      { name: "Clip on", slug: "clip-on" },
    ],
  },
  {
    name: "Mujeres",
    slug: "mujeres",
    subcategories: [
      { name: "Anteojos de sol", slug: "anteojos-de-sol-polarizados" },
      { name: "Armazón de receta", slug: "armazon-de-receta" },
      { name: "Clip on", slug: "clip-on" },
    ],
  },
  {
    name: "Niños",
    slug: "ninos",
    subcategories: [
      {
        name: "Anteojos de sol polarizados",
        slug: "anteojos-de-sol-polarizados",
      },
      { name: "Armazón de receta", slug: "armazon-de-receta" },
      { name: "Clip on", slug: "clip-on" },
    ],
  },
];

const Sidebar = () => {
  const [isMainOpen, setIsMainOpen] = useState(true); // Por UX, lo dejamos abierto por defecto
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const pathname = usePathname();

  // Función para obtener información de categoría y subcategoría
  const getCurrentCategoryInfo = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== "categorias") return null;

    const currentCategorySlug = segments[1];
    const currentSubcategorySlug = segments[2];

    const category = categories.find((cat) => cat.slug === currentCategorySlug);
    const subcategory = category?.subcategories.find(
      (sub) => sub.slug === currentSubcategorySlug
    );

    return { category, subcategory };
  };

  const categoryInfo = getCurrentCategoryInfo();

  // Detectar la categoría activa desde la URL y abrirla si no está abierta
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const currentCategory = segments[1]; // asumiendo /categorias/[categoria]
    const matched = categories.find((cat) => cat.slug === currentCategory);

    if (matched && !openCategories.includes(matched.name)) {
      setOpenCategories((prev) => [...prev, matched.name]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <aside className="h-full w-64 bg-white hidden sm:block">
      <div className="flex flex-col h-full px-4 py-6">
        {/* Breadcrumb y título - Solo en desktop */}
        {categoryInfo?.category && (
          <div className="mb-6 pb-4 border-b border-gray-200">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
              <Link href="/" className="hover:text-gray-700 transition-colors">
                Inicio
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link
                href={`/categorias/${categoryInfo.category.slug}`}
                className="hover:text-gray-700 transition-colors"
              >
                {categoryInfo.category.name}
              </Link>
              {categoryInfo.subcategory && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-gray-700 font-medium text-xs">
                    {categoryInfo.subcategory.name}
                  </span>
                </>
              )}
            </nav>

            {/* Título */}
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {categoryInfo.subcategory
                ? `${categoryInfo.subcategory.name} para ${categoryInfo.category.name}`
                : categoryInfo.category.name}
            </h1>
          </div>
        )}

        {/* Collapse principal: CATEGORÍAS */}
        <div className="border-b pb-4">
          <button
            onClick={() => setIsMainOpen(!isMainOpen)}
            className="flex items-center justify-between w-full text-left text-[#111111] border border-x-transparent border-t-transparent border-b-[#e1e1e1]"
          >
            <span className="font-semibold">CATEGORÍAS</span>
            {isMainOpen ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {isMainOpen && (
              <motion.div
                key="main-categories"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden mt-4 space-y-2"
              >
                {categories.map((category) => {
                  const isOpen = openCategories.includes(category.name);
                  const segments = pathname.split("/").filter(Boolean);
                  const currentCategory = segments[1]; // asumiendo /categorias/[categoria]
                  const isActive = category.slug === currentCategory;

                  return (
                    <div key={category.slug}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/categorias/${category.slug}`}
                          className={`text-sm font-medium text-[#888888] category underline-animate underline-animate-gray ${
                            isActive || isOpen ? "underline-animate-active" : ""
                          }`}
                        >
                          {category.name}
                        </Link>
                        <button
                          onClick={() =>
                            setOpenCategories((prev) =>
                              prev.includes(category.name)
                                ? prev.filter((name) => name !== category.name)
                                : [...prev, category.name]
                            )
                          }
                          className="ml-2 flex items-center"
                          aria-label={
                            isOpen
                              ? "Cerrar subcategorías"
                              : "Abrir subcategorías"
                          }
                        >
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-[#888888]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#888888]" />
                          )}
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.ul
                            key={`subcat-${category.slug}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="ml-4 mt-2 space-y-1 text-sm text-[#888888] overflow-hidden"
                          >
                            {category.subcategories.map((sub) => {
                              const segments = pathname.split("/").filter(Boolean);
                              const currentCategory = segments[1]; // /categorias/[categoria]/[subcategoria]
                              const currentSubcategory = segments[2];
                              const isSubActive =
                                category.slug === currentCategory &&
                                sub.slug === currentSubcategory;

                              return (
                                <li key={sub.slug}>
                                  <Link
                                    href={`/categorias/${category.slug}/${sub.slug}`}
                                    className={`underline-animate underline-animate-gray pb-1 ${
                                      isSubActive ? "text-[#222222]" : ""
                                    }`}
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
