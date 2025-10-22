"use client";

import React, { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import CartDrawer from "./CartDrawer";
import SearchDrawer from "./SearchDrawer";
import AccountDrawer from "./AccountDrawer";

// TiendaDropdown: stateful dropdown that stays open briefly after mouse leave
const TiendaDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [submenuTop, setSubmenuTop] = useState<number>(0);
  const closeTimer = useRef<number | null>(null);
  const primaryRef = useRef<HTMLDivElement | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const openMenu = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    // leave a small delay so user can move pointer to submenu
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setActiveCategory(null);
      closeTimer.current = null;
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const handleCategoryEnter = useCallback((key: string, index: number) => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveCategory(key);

    const catEl = categoryRefs.current[key];
    const primaryEl = primaryRef.current;
    if (!catEl || !primaryEl) {
      setSubmenuTop(0);
      return;
    }

    const catOffset = catEl.offsetTop;
    if (index === 0) {
      // align to top
      setSubmenuTop(0);
    } else {
      // move submenu partially up so it's not as low as the item
      const adjusted = -Math.round(catOffset * 0.6);
      setSubmenuTop(adjusted);
    }
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onFocus={openMenu}
      onMouseLeave={scheduleClose}
      onBlur={scheduleClose}
    >
      <button
        className="text-black underline-animate ml-0 px-2 py-1"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Tienda
      </button>

      {/* Primary dropdown */}
      {open && (
        <div
          ref={primaryRef}
          className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 shadow-sm rounded-none"
          role="menu"
          aria-label="Categorías de tienda"
        >
          <div className="py-1">
            {[
              { key: "mujeres", label: "Mujeres" },
              { key: "hombres", label: "Hombres" },
              { key: "ninos", label: "Niños" },
            ].map((cat, idx) => (
              <div
                key={cat.key}
                className="relative"
                ref={(el) => { categoryRefs.current[cat.key] = el; }}
                onMouseEnter={() => handleCategoryEnter(cat.key, idx)}
                onFocus={() => handleCategoryEnter(cat.key, idx)}
                onMouseLeave={() => setActiveCategory(null)}
                tabIndex={0}
              >
                <Link
                  href={`/categorias/${cat.key}`}
                  className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  role="menuitem"
                >
                  <span>{cat.label}</span>
                  {activeCategory === cat.key && (
                    <Image src="/icons/chevron-right-dropdown.svg" alt="" width={12} height={12} className="ml-2" />
                  )}
                </Link>

                {/* lateral submenu */}
                {activeCategory === cat.key && (
                  <div className="absolute left-full ml-0 w-48 bg-white border border-gray-200 shadow-sm rounded-none" style={{ top: `${submenuTop}px` }}>
                    <div className="py-1">
                      <Link href={`/categorias/${cat.key}/armazon-de-receta`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Armazones Receta</Link>
                      <Link href={`/categorias/${cat.key}/clip-on`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Clip on</Link>
                      <Link href={`/categorias/${cat.key}/anteojos-de-sol-polarizados`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Lentes de sol</Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const navRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const el = navRef.current;
    if (!el) return;

    const setVar = (height: number) => {
      document.documentElement.style.setProperty("--navbar-height", `${Math.round(height)}px`);
    };

    // initial set
  setVar(el.getBoundingClientRect().height);
  // mark root so other components (hero) can avoid visual jumps until var is set
  document.documentElement.classList.add("has-navbar-height");

    const onResize = () => setVar(el.getBoundingClientRect().height);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(onResize);
      ro.observe(el);
    } else {
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
    }

    return () => {
      if (ro) ro.disconnect();
      else {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
      }
      // cleanup class on unmount
      document.documentElement.classList.remove("has-navbar-height");
    };
  }, []);

  return (
    <div ref={navRef} className="navbar bg-white shadow-sm px-4 sm:px-6 md:px-8 lg:px-10 z-100 sticky top-0">
      <div className="flex-1 flex items-center gap-4">
        <Link href="/" className="flex-none">
          <Image
            src="/logo-todo-armazones.png"
            alt="Todo Armazones — ir al inicio"
            width={150}
            height={75}
            priority
            className="w-32 md:w-[150px] h-auto"
          />
        </Link>
        <Link
          href="/"
          className="hidden md:inline text-black underline-animate ml-2"
        >
          Inicio
        </Link>
        <Link
          href="/nosotros"
          className="hidden md:inline text-black underline-animate"
        >
          Nosotros
        </Link>
        {/* Tienda dropdown: stateful to avoid closing too quickly and to show lateral submenus */}
        <div className="hidden md:inline-block relative">
          {/* Button + dropdown wrapper */}
          <div
            className="inline-block"
            onMouseEnter={() => {
              /* open primary dropdown */
            }}
          >
            {/* control open state with React to add small closing delay */}
            <TiendaDropdown />
          </div>
        </div>
        <Link
          href="/catalogo"
          className="flex items-center gap-2 bg-white text-black cursor-pointer whitespace-nowrap underline-animate"
          aria-label="Ir al catálogo"
        >
          <span className="md:hidden">Catálogo PDF</span>
          <span className="hidden md:inline">Descargar Catálogo PDF</span>
        </Link>
      </div>
      <div className="flex flex-row items-center gap-2 flex-none">
        <SearchDrawer />
        <CartDrawer />

        <AccountDrawer />
      </div>
    </div>
  );
};

export default Navbar;
