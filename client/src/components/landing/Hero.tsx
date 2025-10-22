"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, Variants, useReducedMotion, animate } from "framer-motion";

const Hero = () => {
  const shouldReduceMotion = useReducedMotion();
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const target = document.getElementById("categorias");
    if (!target) return;

    // Helper to temporarily make element focusable, focus it without scrolling,
    // and then restore its previous tabindex state.
    const focusTarget = () => {
      if (!(target instanceof HTMLElement)) return;
      const prevTabIndex = target.getAttribute("tabindex");
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (prevTabIndex !== null) {
        target.setAttribute("tabindex", prevTabIndex);
      } else {
        target.removeAttribute("tabindex");
      }
    };

    // Compute navbar offset (read CSS var or fallback to 64px).
    const computed = getComputedStyle(document.documentElement).getPropertyValue("--navbar-height") || "64px";
    const navbarPx = parseInt(computed.replace("px", ""), 10) || 0;

    // If user prefers reduced motion, jump to position but still account for navbar offset and focus.
    if (shouldReduceMotion) {
      const top = target.getBoundingClientRect().top + (window.scrollY || 0) - navbarPx;
      const safeTop = Math.max(0, Math.ceil(top));
      // instant jump (no smooth) but with offset so target isn't hidden under navbar
      window.scrollTo(0, safeTop);
      focusTarget();
      return;
    }
    // Smooth scroll using framer-motion's animate so we can control easing/duration
    // and still call focus after animation completes. Use document.scrollingElement when available.
    if (typeof window !== "undefined") {
      const scrollTop = (document.scrollingElement as Element & { scrollTop?: number })?.scrollTop ?? window.scrollY ?? 0;
      const top = target.getBoundingClientRect().top + scrollTop - navbarPx;
      const safeTop = Math.max(0, Math.ceil(top));

      // cancel previous animation if any
      if (animationRef.current && typeof animationRef.current.stop === "function") {
        try {
          animationRef.current.stop();
        } catch {
          // ignore
        }
      }

      animationRef.current = animate(scrollTop, safeTop, {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v: number) => window.scrollTo(0, v),
        onComplete: () => {
          focusTarget();
          animationRef.current = null;
        },
      });
    }
  };

  // cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current && typeof animationRef.current.stop === "function") {
        try {
          animationRef.current.stop();
        } catch {
          // noop
        }
      }
    };
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = shouldReduceMotion
    ? { hidden: { y: 0, opacity: 1 }, visible: { y: 0, opacity: 1 } }
    : { hidden: { y: 50, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8 } } };

  return (
  <div className="hero flex items-center justify-center relative px-0">
      <Image
        src={"/hero.jpg"}
        alt=""
        fill
        className="object-cover z-0"
        loading="eager"
        priority
      />
      <div className="absolute inset-0 bg-black/25"></div>
      <motion.div 
        className="text-center text-white p-4 sm:p-8 rounded-lg relative z-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-2xl sm:text-5xl lg:text-6xl font-semibold mb-4 font-jost leading-snug sm:leading-tight tracking-tight"
          variants={itemVariants}
        >
          <span className="block">Venta mayorista de armazones</span>
          <span className="block">y anteojos de sol</span>
        </motion.h1>
        <motion.p 
          className="hidden lg:block text-xl mb-6"
          variants={itemVariants}
        >
          Proveedores Mayoristas de insumos ópticos, todo lo que necesitas para tus
          clientes en un solo lugar
        </motion.p>
        <motion.button
          id="hero-cta"
          type="button"
          aria-label="Ir a categorías"
          className="button-sweep rounded-none px-4 py-2 inline-flex items-center font-semibold mx-auto z-0"
          onClick={handleClick}
          variants={itemVariants}
          whileHover={!shouldReduceMotion ? { scale: 1.03 } : undefined}
          whileTap={!shouldReduceMotion ? { scale: 0.98 } : undefined}
        >
          <span>TIENDA</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-right-icon lucide-arrow-right w-8 h-8 ml-2"
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Hero;