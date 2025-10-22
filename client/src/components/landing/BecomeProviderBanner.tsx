"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, Variants, useReducedMotion } from 'framer-motion';

export interface Props {
  src1?: string;
  src2?: string;
  alt1?: string;
  alt2?: string;
  href?: string;
}

const BecomeProviderBanner: React.FC<Props> = ({
  src1 = '/become-provider-1.jpg',
  src2 = '/become-provider-2.jpg',
  alt1 = "Banner imagen 1",
  alt2 = "Banner imagen 2",
  href = "contacto",
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Using string srcs with next/image + fill inside fixed-height wrappers
  // New approach: detect natural sizes on client and render Image with width/height
  const [natural1, setNatural1] = useState<{ width: number; height: number } | null>(null);
  const [natural2, setNatural2] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!src1) return;
    let mounted = true;
    const img = new window.Image();
    img.src = src1;
    img.onload = () => {
      if (!mounted) return;
      setNatural1({ width: img.naturalWidth, height: img.naturalHeight });
    };
    return () => {
      mounted = false;
    };
  }, [src1]);

  useEffect(() => {
    if (!src2) return;
    let mounted = true;
    const img = new window.Image();
    img.src = src2;
    img.onload = () => {
      if (!mounted) return;
      setNatural2({ width: img.naturalWidth, height: img.naturalHeight });
    };
    return () => {
      mounted = false;
    };
  }, [src2]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

  const imageVariants: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1, scale: 1 }, visible: { opacity: 1, scale: 1 } }
    : { hidden: { opacity: 0, scale: 0.98 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } } };
  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
  <div className="rounded-lg p-6 sm:p-8">
          {/* Animation container */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center"
            variants={containerVariants}
            initial="hidden"
            // If user prefers reduced motion, animate on mount; otherwise animate when in view
            {...(!shouldReduceMotion
              ? { whileInView: 'visible', viewport: { once: true, amount: 0.2 } }
              : { animate: 'visible' })}
          >
            <motion.div className="lg:col-span-1" variants={itemVariants}>
              <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                <span className="block">¿Querés vender</span>
                <span className="block text-indigo-600">nuestros productos?</span>
              </h2>
              <p className="mt-3 text-gray-600">
                Contamos con cientos de productos para que tu optica siempre este
                a la vanguardia
              </p>
              <div className="mt-4">
                <motion.a
                  href={href}
                  role="button"
                  aria-label="sumanos como provedor"
                  className="button-sweep button-dark rounded-none px-4 py-2 items-center font-semibold mx-auto inline-flex"
                  whileHover={!shouldReduceMotion ? { scale: 1.03 } : undefined}
                  whileTap={!shouldReduceMotion ? { scale: 0.98 } : undefined}
                  variants={itemVariants}
                >
                  <span>SUMANOS COMO PROVEEDOR</span>
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
                </motion.a>
              </div>
            </motion.div>

            <motion.div className="lg:col-span-3" variants={itemVariants}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div className="w-full flex justify-center" variants={imageVariants}>
                  {natural1 ? (
                    <Image
                      src={src1 || ''}
                      alt={alt1}
                      width={natural1.width}
                      height={natural1.height}
                      className="max-w-full h-auto block"
                    />
                  ) : null}
                </motion.div>
                <motion.div className="w-full flex justify-center" variants={imageVariants}>
                  {natural2 ? (
                    <Image
                      src={src2 || ''}
                      alt={alt2}
                      width={natural2.width}
                      height={natural2.height}
                      className="max-w-full h-min block"
                    />
                  ) : null}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BecomeProviderBanner;