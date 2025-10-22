"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { motion, Variants, useReducedMotion } from "framer-motion";

export default function ContactPage() {
  const shouldReduceMotion = useReducedMotion();

  const INITIAL_Y = 80;

  const formVariants: Variants = {
    hidden: { opacity: 0, y: INITIAL_Y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  const formInitial = shouldReduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: INITIAL_Y };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as Window & { scrollTo: (x: number, y: number) => void };
    const prev = (history && history.scrollRestoration) || undefined;
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    } catch {
      // ignore
    }
    win.scrollTo(0, 0);
    return () => {
      try {
        if (prev !== undefined) history.scrollRestoration = prev;
      } catch {
        // ignore
      }
    };
  }, []);

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: INITIAL_Y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.12 } },
  };

  const itemVariants: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
    <main className="container mx-auto px-6 py-12">
      <motion.section
        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        variants={sectionVariants}
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : 'hidden'}
        {...(!shouldReduceMotion ? { whileInView: 'visible', viewport: { once: true, amount: 0.15 } } : { animate: 'visible' })}
      >
        <motion.div className="w-full h-64 md:h-96 relative rounded-none overflow-hidden shadow-lg" variants={itemVariants}>
          <Image
            src="/contacto-1.jpg"
            alt="Contacto"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>

        <motion.div className="flex flex-col justify-center" variants={itemVariants}>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Exclusivamente para
            <br />
            venta digital mayorista
          </h2>
          <p className="mt-4 text-gray-700">
            Email: {" "}
            <a
              href="mailto:info@todoarmazonesarg.com"
              className="text-indigo-600"
            >
              info@todoarmazonesarg.com
            </a>
          </p>
        </motion.div>
      </motion.section>

      <section className="mt-12 bg-gray-50 p-8 rounded-lg">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="mt-6"
            variants={formVariants}
            initial={formInitial}
            {...(!shouldReduceMotion
              ? {
                  whileInView: "visible",
                  viewport: { once: true, amount: 0.2 },
                }
              : { animate: "visible" })}
          >
            <h3 className="text-2xl font-bold text-gray-900 text-center">
              Deja tus datos y te contactaremos
            </h3>

            <form
              className="mt-6 grid grid-cols-1 gap-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nombre
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nombre"
                    className="w-full px-4 py-2 border rounded-md bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 border rounded-md bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  Asunto
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Asunto"
                  className="w-full px-4 py-2 border rounded-md bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Mensaje"
                  rows={6}
                  className="w-full px-4 py-2 border rounded-md bg-white resize-vertical"
                />
              </div>

              <div className="mt-4">
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#444444] text-[#F5FFFA] font-semibold rounded-none hover:opacity-90"
                  >
                    ENVIAR
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
