import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchIcon from "../atoms/Icon/SearchIcon";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "../molecules/ProductCard";
import { usePathname } from "next/navigation";
import { useEventListener } from "@/hooks/useEventBus";
import { searchEvents } from "@/utils/eventBus";

const drawerVariants = {
  hidden: { y: "-100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: { y: "-100%", opacity: 0, transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.9, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const SearchDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const pathname = usePathname();

  const { searchResults, searchLoading, searchProducts, clearSearchResults } =
    useProducts();

  // Escuchar eventos para abrir/cerrar el drawer
  useEventListener("search:openDrawer", () => {
    setOpen(true);
  });

  useEventListener("search:closeDrawer", () => {
    handleClose();
  });

  useEventListener("search:closeIfOpen", () => {
    if (open) {
      handleClose();
    }
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      clearSearchResults();
      setSearching(false);
      return;
    }
    setSearching(true);
    await searchProducts(query);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    clearSearchResults();
    setSearching(false);
  };

  // Cerrar drawer cuando cambie el pathname
  useEffect(() => {
    searchEvents.closeIfOpen();
  }, [pathname]);

  return (
    <>
      {/* Botón para abrir el Drawer */}
      <button
        className="flex items-center gap-2 bg-white text-black cursor-pointer"
        onClick={() => searchEvents.openDrawer()}
        aria-label="Abrir búsqueda"
      >
        <SearchIcon />
        <span className="hidden sm:inline">Buscar</span>
      </button>

      {/* Drawer y Overlay animados */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-50 bg-white"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => searchEvents.closeDrawer()}
              style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
            />
            {/* Drawer */}
            <motion.div
              className="fixed left-0 top-0 w-full max-w-full h-screen z-50 bg-white shadow-lg"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ overflow: "hidden" }}
            >
              {/* Botón cerrar */}
              <div className="flex justify-end p-4">
                <button
                  className="text-black hover:text-gray-700 text-2xl"
                  onClick={() => searchEvents.closeDrawer()}
                  aria-label="Cerrar búsqueda"
                >
                  ✕
                </button>
              </div>
              {/* Contenido centrado y scrollable */}
              <div className="flex flex-col items-center justify-center px-4 py-8 h-[calc(100vh-64px)] overflow-hidden">
                {/* Sticky header y barra */}
                <div className="w-full max-w-6xl sticky top-0 z-20 bg-white pb-4 pt-2 shadow-sm" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)' }}>
                  <span
                    className="text-lg font-semibold mb-4 text-center block"
                    style={{ color: "#111111" }}
                  >
                    ¿QUÉ ESTÁS BUSCANDO?
                  </span>
                  <form
                    className="w-full max-w-md mx-auto"
                    onSubmit={handleSearch}
                    autoComplete="off"
                  >
                    <div className="relative">
                      <input
                        type="search"
                        placeholder="Buscar productos..."
                        className="flex-1 w-full outline-none px-3 py-2 bg-transparent text-black rounded-none pr-10"
                        style={{
                          border: "1px solid #e1e1e1",
                          color: "#111111",
                        }}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="absolute inset-y-0 right-3 flex items-center text-black"
                        aria-label="Buscar"
                        tabIndex={0}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <SearchIcon />
                      </button>
                      <style>{`
                        input::placeholder {
                          color: #888888 !important;
                          opacity: 1;
                        }
                      `}</style>
                    </div>
                  </form>
                  {searching && (
                    <h3 className="text-base font-semibold mb-2 mt-4 text-[#222222]">
                      Resultados de la búsqueda{query && `: "${query}"`}
                    </h3>
                  )}
                </div>
                {/* Resultados de búsqueda scrollable */}
                {searching && (
                  <motion.div
                    className="w-full max-w-6xl flex-1 mt-2 overflow-y-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ maxHeight: 'calc(100vh - 210px)' }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-8">
                      {searchLoading && (
                        <div className="col-span-full text-center text-sm opacity-60">
                          Buscando...
                        </div>
                      )}
                      {!searchLoading && searchResults.length === 0 && (
                        <div className="col-span-full text-center text-sm opacity-60">
                          No se encontraron productos
                        </div>
                      )}
                      {searchResults.map((product) => (
                        <ProductCard key={product.id} {...product} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchDrawer;
