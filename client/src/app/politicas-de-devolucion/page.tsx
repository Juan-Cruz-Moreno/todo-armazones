"use client"

import React, { useEffect } from 'react'
import Image from 'next/image'
import { motion, Variants, useReducedMotion } from 'framer-motion'

export default function PoliticasDeDevolucionPage() {
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
					<h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Políticas de devolución</h1>
					<div className="text-base text-gray-800 space-y-4 text-justify">
						<p>Antes de comprar, el usuario deberá tener en cuenta las características de los productos seleccionados.</p>
						<p>Toda compra se encuentra sujeta a disponibilidad y solamente se confirmará la disponibilidad con el número de operación confirmada, en la última etapa del proceso de compra. Así mismo, en el caso de que el o los productos seleccionados se encontrasen agotados o demorados, TODO ARMAZONES se comunicará con el usuario y lo invitará a que elija una de las siguientes opciones:</p>
						<ul>
							<li>A) Continuar esperando la entrega del producto elegido (en caso de demora)</li>
							<li>B) Cancelación de la compra y devolución del importe por el medio de pago original.</li>
							<li>C) Optar por un producto alternativo</li>
							<li>D) Cancelación de la compra y emisión de una nota de crédito por el mismo importe.</li>
						</ul>
						<p>Cuando el usuario opte por cancelar la compra, se devolverá el importe abonado según el medio de pago que se haya elegido oportunamente.</p>
						<p>En el caso de que el usuario opte por el producto alternativo que le ofrece TODO ARMAZONES éste deberá contener características iguales o superiores. Para las situaciones contempladas en este apartado, el usuario tendrá un plazo de diez días de corrido para elegir una de las opciones mencionadas.</p>
						<p>Los usuarios o clientes podrán solicitar devoluciones o cambios, dentro del territorio de Argentino.</p>
						<p>Para que una devolución o cambio sea aceptado, el usuario deberá solicitar la devolución dentro de los 10 días de la fecha de la factura segun estipulado por la Ley del Consumidor. Esto sólo se cumplirá si el producto adquirido a través de este sitio fuera devuelto sin uso, sellado de fábrica, con sus etiquetas, embalaje y accesorios originales, y junto con su factura respectiva.</p>
						<p>Los productos devueltos deben estar en la condición en que los recibió y en la caja y/o embalaje original.</p>
						<p className="font-semibold">* Desafortunadamente no ofrecemos reembolsos por lo siguiente:</p>
						<ul>
							<li>· Kit de mosaicos parcialmente completadas.</li>
							<li>· Kit de mosaicos totalmente completadas.</li>
							<li>· Kits personalizados.</li>
						</ul>
						<p>Usted será responsable de pagar sus propios costos de envío para devolver su artículo. Los gastos de envío no pueden ser reembolsados.</p>

						<h2 className="text-2xl font-bold mt-8 mb-2">CANCELACIONES DE ORDEN</h2>
						<p>Si su pedido se encuentra actualmente en tránsito, lamentablemente no podemos ofrecer cancelar ni reembolsar su pedido.</p>
						<p>Para cancelar su pedido, comuníquese a <a href="mailto:info@todoarmazonesarg.com" className="text-indigo-600">info@todoarmazonesarg.com</a> en su correo electrónico incluya:</p>
						<ul>
							<li>· Su número de pedido (puede encontrarlo en el correo electrónico de confirmación)</li>
							<li>· Su nombre (o el nombre de la persona que realizó la compra)</li>
							<li>· La dirección de correo electrónico que utilizó para completar su pedido</li>
							<li>· Número de contacto</li>
						</ul>
						<h3 className="text-xl font-bold mt-6 mb-2">Plazo de Cancelación</h3>
						<p>Después de que se apruebe la cancelación de su pedido, recibirá un correo electrónico confirmando la cancelación y el reembolso. Espere de 3 a 5 días hábiles para que su pedido sea procesado por su institución financiera</p>
					</div>
				</motion.div>
				{/* Imagen 2/5 derecha */}
				<motion.div className="md:col-span-2 flex items-start justify-center" variants={itemVariants}>
					<div className="relative w-full h-72 md:h-[500px] rounded-none overflow-hidden shadow-lg">
						<Image src="/devolucion.jpg" alt="Políticas de devolución" fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
					</div>
				</motion.div>
			</motion.section>
		</main>
	)
}
