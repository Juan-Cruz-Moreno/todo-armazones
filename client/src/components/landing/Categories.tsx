'use client';

import Image from "next/image";
import Link from "next/link";
import { motion, Variants, useReducedMotion } from 'framer-motion';

const Categories = () => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.12, when: 'beforeChildren' } },
  };

  const itemVariants: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

  return (
    <section id="categorias" className="py-12" style={{ scrollMarginTop: 'var(--navbar-height)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          variants={containerVariants}
          initial="hidden"
          {...(!shouldReduceMotion ? { whileInView: 'visible', viewport: { once: true, amount: 0.15 } } : { animate: 'visible' })}
        >
          <motion.h2 className="text-3xl font-bold text-gray-900 mb-4" variants={itemVariants}>
            Productos de óptica <span>para toda la familia</span>
          </motion.h2>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row justify-center items-center gap-2.5"
          variants={containerVariants}
          initial="hidden"
          {...(!shouldReduceMotion ? { whileInView: 'visible', viewport: { once: true, amount: 0.15 } } : { animate: 'visible' })}
        >
          {/* Card 1: Mujer */}
          <motion.div className="relative max-w-sm w-full h-96 overflow-hidden" variants={itemVariants}>
            <Image
              src="/women-category.jpg"
              alt="Categoría Mujer"
              fill
              style={{ objectFit: "cover" }}
            />
            <div className="absolute inset-0 bg-black/25 flex flex-col justify-end p-6">
              <div className="text-center">
                <Link
                  href="/categorias/mujeres"
                  className="text-white text-2xl font-bold mb-4 block"
                >
                  Mujeres
                </Link>
                <div className="space-y-2">
                  <Link
                    href="/categorias/mujeres/armazon-de-receta"
                    className="block text-white text-sm"
                  >
                    Armazones Receta
                  </Link>
                  <Link
                    href="/categorias/mujeres/clip-on"
                    className="block text-white text-sm"
                  >
                    Clip on
                  </Link>
                  <Link
                    href="/categorias/mujeres/anteojos-de-sol-polarizados"
                    className="block text-white text-sm"
                  >
                    Lentes de sol
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Hombre */}
          <motion.div className="relative max-w-sm w-full h-96 overflow-hidden" variants={itemVariants}>
            <Image
              src="/men-category.jpg"
              alt="Categoría Hombre"
              fill
              style={{ objectFit: "cover" }}
            />
            <div className="absolute inset-0 bg-black/25 flex flex-col justify-end p-6">
              <div className="text-center">
                <Link
                  href="/categorias/hombres"
                  className="text-white text-2xl font-bold mb-4 block"
                >
                  Hombres
                </Link>
                <div className="space-y-2">
                  <Link
                    href="/categorias/hombres/armazon-de-receta"
                    className="block text-white text-sm"
                  >
                    Armazones Receta
                  </Link>
                  <Link
                    href="/categorias/hombres/clip-on"
                    className="block text-white text-sm"
                  >
                    Clip on
                  </Link>
                  <Link
                    href="/categorias/hombres/anteojos-de-sol-polarizados"
                    className="block text-white text-sm"
                  >
                    Lentes de sol
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Kids */}
          <motion.div className="relative max-w-sm w-full h-96 overflow-hidden" variants={itemVariants}>
            <Image
              src="/kids-category.jpg"
              alt="Categoría Kids"
              fill
              style={{ objectFit: "cover" }}
            />
            <div className="absolute inset-0 bg-black/25 flex flex-col justify-end p-6">
              <div className="text-center">
                <Link
                  href="/categorias/ninos"
                  className="text-white text-2xl font-bold mb-4 block"
                >
                  Niños
                </Link>
                <div className="space-y-2">
                  <Link
                    href="/categorias/ninos/armazon-de-receta"
                    className="block text-white text-sm"
                  >
                    Armazones Receta
                  </Link>
                  <Link
                    href="/categorias/ninos/clip-on"
                    className="block text-white text-sm"
                  >
                    Clip on
                  </Link>
                  <Link
                    href="/categorias/ninos/anteojos-de-sol-polarizados"
                    className="block text-white text-sm"
                  >
                    Lentes de sol
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;