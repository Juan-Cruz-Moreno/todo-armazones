"use client"

import React, { useEffect } from 'react'
import Image from 'next/image'
import { motion, Variants, useReducedMotion } from 'framer-motion'

export default function PoliticasDeEnvioPage() {
  const shouldReduceMotion = useReducedMotion()
  const INITIAL_Y = 80

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: INITIAL_Y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, staggerChildren: 0.12 } },
  }

  const itemVariants: Variants = shouldReduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

    useEffect(() => {
      if (typeof window === 'undefined') return
      const win = window as Window & { scrollTo: (x: number, y: number) => void }
      const prev = (history && history.scrollRestoration) || undefined
      try {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      } catch {
        // ignore
      }
      win.scrollTo(0, 0)
      return () => {
        try {
          if (prev !== undefined) history.scrollRestoration = prev
        } catch {
          // ignore
        }
      }
    }, [])

  return (
    <main className="container mx-auto px-6 py-12">
      <motion.section
        className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start"
        variants={sectionVariants}
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : 'hidden'}
        {...(!shouldReduceMotion ? { whileInView: 'visible', viewport: { once: true, amount: 0.15 } } : { animate: 'visible' })}
      >
        {/* Texto 3/5 izquierda */}
        <motion.div className="md:col-span-3" variants={itemVariants}>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Políticas de envío</h1>
          <div className="text-base text-gray-800 space-y-4 text-justify">
            <p>En TODO ARMAZONES contamos con varias opciones de envío que deberás elegir mientras realizas el check out de tu pedido. Los costos de envío corren a cargo del cliente.</p>
            <p>Nuestra cobertura y servicio de envío permite despachos a todo el país, dependiendo del tipo de envío te solicitaremos los siguientes datos.</p>
            <h2 className="font-bold mt-4">1: Despacho por moto</h2>
            <ul>
              <li>· Persona que recibe y teléfono de contacto</li>
              <li>· Dirección y localidad</li>
              <li>· Ventana horaria de entrega</li>
            </ul>

            <h2 className="font-bold mt-4">2: Transporte</h2>
            <ul>
              <li>· NOMBRE Y APELLIDO DE QUIEN RECIBE</li>
              <li>· DNI / CUIT</li>
              <li>· TEL</li>
              <li>· EMPRESA DE ENCOMIENDA</li>
              <li>· VALOR DECLARADO</li>
              <li>· DIRECCION DE ENTREGA</li>
              <li>· LOCALIDAD</li>
              <li>· CP</li>
            </ul>

            <h2 className="font-bold mt-4">3: Empresas de encomiendas</h2>
            <p>Los tiempos de entrega son referenciales, y podrían sufrir demoras adicionales debido a la contingencia u otros motivos de fuerza mayor.</p>
            <p>El tiempo de entrega dependerá de la zona geográfica de destino.</p>
            <p>Para poder ver el costo de tu envío consultá directamente a nuestro WhatsApp.</p>
            <p>El envío comenzará a regir una vez confirmado y acreditado el pago de la orden de compra, lo cual será notificado por medio de un correo electrónico.</p>
            <p>En el caso de no encontrar a ninguna persona en el segundo intento, el paquete es devuelto a la oficina de origen y para un nuevo despacho se deberá pagar nuevamente.</p>
            <p>Los productos personalizados NO tienen devolución salvo desperfectos. Los costos asociados a la devolución corren por parte del cliente.</p>
            <p>Los pedidos (productos) deben estar pagados en su totalidad para ser despachados. Ésta es la única forma que tenemos de poder garantizar las entregas y poder controlar que todos los pedidos lleguen a destino.</p>
          </div>
        </motion.div>

        {/* Imagen 2/5 derecha */}
        <motion.div className="md:col-span-2 flex items-start justify-center" variants={itemVariants}>
          <div className="relative w-full h-72 md:h-[500px] rounded-none overflow-hidden shadow-lg">
            <Image src="/envio.jpg" alt="Políticas de envío" fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
          </div>
        </motion.div>
      </motion.section>
    </main>
  )
}
