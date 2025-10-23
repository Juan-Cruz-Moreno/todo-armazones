"use client";

import React, { useEffect } from "react";
import { useForm, ValidationError } from "@formspree/react";
import Image from "next/image";
import { motion, Variants, useReducedMotion } from "framer-motion";

export default function AboutUsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [state, handleSubmit] = useForm("xwprgepq");
  const INITIAL_Y = 80;

  const blockVariants: Variants = {
    hidden: { opacity: 0, y: INITIAL_Y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  const blockInitial = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: INITIAL_Y };

  // Ensure page loads at top when reloading (prevent browser from restoring
  // previous scroll position). We set history.scrollRestoration to 'manual'
  // while this page is mounted and restore the previous value on unmount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as Window & { scrollTo: (x: number, y: number) => void };
    const prev = (history && history.scrollRestoration) || undefined;
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    } catch {
      // ignore
    }
    // Force immediate jump to top
    win.scrollTo(0, 0);
    return () => {
      try {
        if (prev !== undefined) history.scrollRestoration = prev;
      } catch {
        // ignore
      }
    };
  }, []);

  // When the form succeeds, focus the success heading without scrolling
  const successHeadingRef = React.useRef<HTMLHeadingElement | null>(null);
  // Derived stable boolean to satisfy react-hooks/exhaustive-deps
  const formSucceeded = !!(state && state.succeeded);

  React.useEffect(() => {
    if (formSucceeded && successHeadingRef.current) {
      try {
        successHeadingRef.current.focus({ preventScroll: true });
      } catch {
        // some browsers may not support preventScroll option
        successHeadingRef.current.focus();
      }
    }
  }, [formSucceeded]);

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
        className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center"
        variants={sectionVariants}
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : 'hidden'}
        {...(!shouldReduceMotion ? { whileInView: 'visible', viewport: { once: true, amount: 0.15 } } : { animate: 'visible' })}
      >
        {/* Left: 3/5 with two images side-by-side */}
        <motion.div className="md:col-span-3 grid grid-cols-2 gap-4" variants={itemVariants}>
          <div className="relative w-full h-64 md:h-96 rounded-none overflow-hidden shadow-lg">
            <Image
              src="/nosotros-1.jpg"
              alt="Nuestro equipo"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="relative w-full h-64 md:h-96 rounded-none overflow-hidden shadow-lg">
            <Image
              src="/nosotros-2.jpg"
              alt="Calidad y servicio"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </motion.div>

        {/* Right: 2/5 with text */}
        <motion.aside className="md:col-span-2" variants={itemVariants}>
          <div className="h-full flex flex-col justify-center gap-6">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-gray-900">
              Calidad, variedad
              <br />y compromiso
            </h2>

            <p className="text-lg text-gray-700">
              Más de 25 años como proveedores de ópticas a nivel nacional.
            </p>

            <p className="text-xl font-semibold text-indigo-600">
              ¡Sumanos vos también!
            </p>
          </div>
        </motion.aside>
      </motion.section>

      {/* Second section: text left (2/5), images right (3/5) */}
      <motion.section
        className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-8 items-center"
        variants={sectionVariants}
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : 'hidden'}
        {...(!shouldReduceMotion ? { whileInView: 'visible', viewport: { once: true, amount: 0.15 } } : { animate: 'visible' })}
      >
        {/* Left: 2/5 with text */}
        <motion.div className="md:col-span-2 flex items-center" variants={itemVariants}>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Nuestra historia
            </h3>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Hemos construido a través del tiempo una empresa capaz de suplir
              las demandas de sus clientes. Ofrecerles un servicio optimizado,
              productos de vanguardia, calidad y compromiso en la entrega. Desde
              1990.
            </p>
          </div>
        </motion.div>

        {/* Right: 3/5 with two images side-by-side */}
        <motion.div className="md:col-span-3 grid grid-cols-2 gap-4" variants={itemVariants}>
          <div className="relative w-full h-56 md:h-80 rounded-none overflow-hidden shadow-lg">
            <Image
              src="/nosotros-3.jpg"
              alt="Historia 1"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="relative w-full h-56 md:h-80 rounded-none overflow-hidden shadow-lg">
            <Image
              src="/nosotros-4.jpg"
              alt="Historia 2"
              fill
              className="object-cover h-auto"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Third section: Contact form */}
      {state && state.succeeded ? (
        <main className="min-h-screen flex items-center justify-center px-6 py-12">
          <section className="w-full max-w-3xl bg-white p-8 rounded-lg shadow flex flex-col items-center justify-center">
            <h3 ref={successHeadingRef} tabIndex={-1} className="text-2xl font-bold text-gray-900 text-center">
              Gracias — tu mensaje fue enviado
            </h3>
            <p className="mt-4 text-center text-gray-700">Te contactaremos pronto.</p>
          </section>
        </main>
      ) : (
        <section className="mt-20 bg-gray-50 p-8 rounded-lg">
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="mt-6"
              variants={blockVariants}
              initial={blockInitial}
              {...(!shouldReduceMotion
                ? { whileInView: "visible", viewport: { once: true, amount: 0.2 } }
                : { animate: "visible" })}
            >
              <h3 className="text-2xl font-bold text-gray-900 text-center">
                Sumanos como tu proveedor
              </h3>
              <p className="mt-4 text-gray-700 text-center max-w-2xl mx-auto">
                Si querés recibir la información completa, de cómo sumarnos a la
                lista de tus proveedores. Dejanos tus datos y te haremos llegar
                todo por mail.
              </p>

              <form
                className="mt-6 grid grid-cols-1 gap-4"
                onSubmit={handleSubmit}
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
                      type="text"
                      name="name"
                      placeholder="Nombre"
                      className="w-full px-4 py-2 border border-gray-200 rounded-md bg-white text-black focus:outline-none focus:ring-1 focus:ring-indigo-200"
                    />
                      <ValidationError prefix="Name" field="name" errors={state.errors} />
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
                      type="email"
                      name="email"
                      placeholder="Email"
                      className="w-full px-4 py-2 border border-gray-200 rounded-md bg-white text-black focus:outline-none focus:ring-1 focus:ring-indigo-200"
                    />
                      <ValidationError prefix="Email" field="email" errors={state.errors} />
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
                    type="text"
                    name="subject"
                      placeholder="Asunto"
                      className="w-full px-4 py-2 border border-gray-200 rounded-md bg-white text-black focus:outline-none focus:ring-1 focus:ring-indigo-200"
                  />
                    <ValidationError prefix="Subject" field="subject" errors={state.errors} />
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-md bg-white text-black resize-vertical focus:outline-none focus:ring-1 focus:ring-indigo-200"
                  />
                    <ValidationError prefix="Message" field="message" errors={state.errors} />
                </div>

                <div className="mt-4">
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={state.submitting}
                      className="px-8 py-3 bg-[#444444] text-[#F5FFFA] font-semibold rounded-none hover:opacity-90 disabled:opacity-60"
                    >
                      {state.submitting ? "ENVIANDO..." : "ENVIAR"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      )}
    </main>
  );
}

// Presentational form: connect to your API route when ready.
