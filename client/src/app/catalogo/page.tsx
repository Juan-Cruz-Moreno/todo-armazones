"use client";

import { useCatalog } from "@/hooks/useCatalog";
import { Category, Subcategory } from "@/interfaces/catalog";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import PriceAdjustments from "@/components/catalog/PriceAdjustments";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  Users,
  DollarSign,
} from "lucide-react";

const CatalogPage = () => {
  const {
    state,
    categories,
    filteredSubcategories,
    form,
    handlers,
    selectedCategories,
    selectedSubcategories,
    priceAdjustments,
  } = useCatalog();

  const { loading, error, logoPreview, emailSent, emailAddress } = state;

  const {
    handleLogoChange,
    removeLogo,
    handleCategoryChange,
    handleSubcategoryChange,
    clearError,
    clearSuccess,
    addPriceAdjustment,
    removePriceAdjustment,
    updatePriceAdjustment,
    onSubmit,
  } = handlers;

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-[#e1e1e1] overflow-hidden relative z-0"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-[#222222] via-[#1a1a1a] to-[#111111] px-6 py-12 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 text-6xl">💰</div>
              <div className="absolute top-20 right-20 text-4xl">📈</div>
              <div className="absolute bottom-10 left-1/4 text-5xl">🚀</div>
            </div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎯</div>
                <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                  ¡Crea tu catálogo{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                    GRATIS
                  </span>{" "}
                  en 2 minutos!
                </h1>
                <p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto mb-6">
                  Recibe un PDF profesional con precios que{" "}
                  <span className="font-bold text-white">
                    maximizan tus ganancias
                  </span>
                  . ¡Miles de vendedores ya lo hicieron esta semana!
                </p>

                {/* Social Proof */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                  <div className="flex items-center justify-center gap-4 text-white">
                    <div className="text-center">
                      <div className="text-2xl font-bold">1,247</div>
                      <div className="text-sm text-gray-300">
                        Catálogos creados
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/30"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-sm text-gray-300">Satisfacción</div>
                    </div>
                    <div className="w-px h-8 bg-white/30"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">2 min</div>
                      <div className="text-sm text-gray-300">
                        Tiempo promedio
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Intro */}
            <div className="mb-8 text-center">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-100 mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-4xl">⚡</div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-[#222222]">
                        ¡Solo 3 pasos para vender más!
                      </h2>
                      <p className="text-[#666666]">
                        Email → Personaliza → ¡Recibe tu catálogo!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Campo Email */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#222222] flex items-center justify-center gap-3 mb-4">
                    <Mail className="w-6 h-6 text-blue-600" />
                    ¡Empieza aquí! Solo necesitamos tu email
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 mb-6">
                    <p className="text-[#222222] font-medium mb-2 flex items-center justify-center gap-2">
                      <span className="text-lg">📧</span>
                      ¡Te enviamos todo listo para vender!
                    </p>
                    <p className="text-sm text-[#666666] text-center">
                      Recibirás tu catálogo profesional completo en tu bandeja
                      de entrada.
                      <span className="font-bold text-blue-600">
                        ¡Es gratis y llega en segundos!
                      </span>
                    </p>
                  </div>
                </div>

                <div className="max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="tu-email@ejemplo.com"
                    className={`input w-full border-2 border-[#e1e1e1] rounded-xl bg-[#FFFFFF] text-[#222222] text-lg py-4 px-6 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all ${
                      errors.email ? "input-error border-red-500" : ""
                    }`}
                    {...register("email", {
                      required:
                        "¡Necesitamos tu email para enviarte el catálogo!",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Por favor, ingresa un email válido",
                      },
                    })}
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm flex items-center gap-1 mt-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>
              </div>
              {/* Categorías */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#222222] flex items-center justify-center gap-3 mb-2">
                    🎯 Paso 2: ¿A quién vendes?
                  </h3>
                  <p className="text-[#666666] mb-4">
                    Selecciona tus clientes ideales
                  </p>
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium inline-block">
                    ✅ Todo seleccionado por defecto para máximo alcance
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {categories.map((category: Category) => (
                    <motion.label
                      key={category.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedCategories.includes(category.id)
                          ? "border-green-500 bg-green-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) =>
                          handleCategoryChange(category.id, e.target.checked)
                        }
                        className="checkbox checkbox-success checkbox-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">
                            {category.slug === "hombres"
                              ? "👨"
                              : category.slug === "mujeres"
                              ? "👩"
                              : "👶"}
                          </span>
                          <div className="font-bold text-[#222222] text-lg">
                            {category.title}
                          </div>
                        </div>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Subcategorías */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#222222] flex items-center justify-center gap-3 mb-2">
                    📦 Paso 3: ¿Qué productos ofreces?
                  </h3>
                  <p className="text-[#666666] mb-4">
                    Elige los tipos de productos que vendes
                  </p>
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium inline-block">
                    ✅ Todo seleccionado por defecto para catálogo completo
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {filteredSubcategories.map((subcategory: Subcategory) => (
                    <motion.label
                      key={subcategory.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedSubcategories.includes(subcategory.id)
                          ? "border-blue-500 bg-blue-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubcategories.includes(subcategory.id)}
                        onChange={(e) =>
                          handleSubcategoryChange(
                            subcategory.id,
                            e.target.checked
                          )
                        }
                        className="checkbox checkbox-primary checkbox-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">
                            {subcategory.slug === "armazon-de-receta"
                              ? "👓"
                              : subcategory.slug ===
                                "anteojos-de-sol-polarizados"
                              ? "🕶️"
                              : "🔄"}
                          </span>
                          <div className="font-bold text-[#222222] text-lg">
                            {subcategory.title}
                          </div>
                        </div>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-[#222222] flex items-center justify-center gap-3 mb-2">
                    🎨 Personalización (Opcional)
                  </h3>
                  <p className="text-[#666666] mb-4">
                    Haz que tu catálogo luzca único con tu logo
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 max-w-2xl mx-auto">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">✨</div>
                    <p className="text-sm text-[#666666] mb-4">
                      Si tienes un logo, súbelo aquí. Si no, usaremos uno
                      profesional por defecto.
                      <span className="font-bold text-purple-600">
                        {" "}
                        ¡Es opcional!
                      </span>
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                    />
                  </div>

                  {logoPreview && (
                    <div className="flex justify-center mt-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                      >
                        <img
                          src={logoPreview}
                          alt="Preview del logo"
                          className="w-24 h-24 object-contain border-2 border-purple-200 rounded-xl bg-white shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 btn btn-circle btn-sm bg-red-500 hover:bg-red-600 border-none text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          ×
                        </button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ajustes de Precio */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#222222] flex items-center justify-center gap-3 mb-2">
                    💰 Paso 4: ¡Maximiza tus ganancias!
                  </h3>
                  <p className="text-[#666666] mb-4">
                    Configura precios inteligentes que aumenten tus márgenes
                  </p>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="text-3xl">📈</span>
                      <div className="text-left">
                        <p className="font-bold text-[#222222]">
                          ¡Cada porcentaje cuenta!
                        </p>
                        <p className="text-sm text-[#666666]">
                          35% de incremento = $100 → $135 ¡Más dinero en tu
                          bolsillo!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <PriceAdjustments
                    priceAdjustments={priceAdjustments}
                    categories={categories}
                    subcategories={filteredSubcategories}
                    onAdd={addPriceAdjustment}
                    onRemove={removePriceAdjustment}
                    onUpdate={updatePriceAdjustment}
                  />
                </div>
              </div>

              {/* Alertas de estado - cerca del botón */}
              {/* Alert de carga */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="alert alert-info border-2 border-blue-200"
                  >
                    <div className="flex items-center gap-4">
                      <LoadingSpinner size="lg" />
                      <div className="flex-1">
                        <div className="font-bold text-blue-800 text-lg mb-1">
                          🚀 ¡Estamos creando tu catálogo profesional!
                        </div>
                        <div className="text-sm text-blue-700 mb-2">
                          Procesando {selectedCategories.length} categorías y{" "}
                          {selectedSubcategories.length} tipos de productos...
                        </div>
                        <div className="bg-blue-100 rounded-full h-2">
                          <motion.div
                            className="bg-blue-600 h-2 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          ¡Solo toma 2 minutos! Puedes cerrar esta página
                          tranquilamente.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Catálogo enviado por email */}
              <AnimatePresence>
                {emailSent && !loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="alert alert-success border-2 border-green-200"
                  >
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <div className="font-bold text-green-800 text-lg mb-2">
                        🎉 ¡Tu catálogo profesional está listo!
                      </div>
                      <div className="text-sm text-green-700 mb-3">
                        Hemos enviado tu PDF personalizado a{" "}
                        <strong className="text-green-800">
                          {emailAddress}
                        </strong>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800 mb-2">
                          <span className="text-lg">📧</span>
                          <span className="font-semibold">
                            ¡Revisa tu bandeja de entrada!
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          Si no lo ves en los próximos minutos, revisa tu
                          carpeta de spam. ¡Ya puedes empezar a vender con tu
                          catálogo profesional! 🚀
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearSuccess}
                      className="btn btn-sm btn-circle btn-ghost text-green-800 hover:bg-green-100"
                    >
                      ×
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="alert alert-error"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">
                      Oops, algo salió mal: {error}. ¡Inténtalo de nuevo,
                      estamos aquí para ayudarte! 😊
                    </span>
                    <button
                      onClick={clearError}
                      className="btn btn-sm btn-ghost text-red-800 hover:bg-red-600 hover:text-white"
                    >
                      ×
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón de envío */}
              <div className="flex justify-center pt-8 border-t border-[#e1e1e1]">
                <div className="text-center">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`btn btn-lg border-none rounded-2xl px-12 py-6 text-xl font-bold transition-all duration-300 transform shadow-2xl ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed opacity-70 pointer-events-none"
                        : "bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white hover:from-green-600 hover:via-blue-600 hover:to-purple-700 cursor-pointer hover:shadow-3xl"
                    }`}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="lg" />
                        <span className="text-white ml-3">
                          Creando tu catálogo profesional...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <Mail className="w-7 h-7 text-white" />
                          <div className="text-left">
                            <div className="text-white text-lg font-bold">
                              🚀 ¡CREA MI CATÁLOGO GRATIS!
                            </div>
                          </div>
                          <span className="text-3xl">💰</span>
                        </div>
                      </>
                    )}
                  </motion.button>

                  {!loading && (
                    <div className="mt-4 text-center">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200 inline-block">
                        <p className="text-[#222222] font-bold text-sm flex items-center gap-2">
                          <span className="text-lg">⚡</span>
                          ¡Miles de vendedores ya aumentaron sus ganancias con
                          nuestros catálogos!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Info adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-lg border border-blue-100 p-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-[#222222] mb-4 flex items-center justify-center gap-3">
              <span className="text-5xl">🎯</span>
              ¡Únete a miles de vendedores exitosos!
            </h3>
            <p className="text-[#666666] text-lg max-w-2xl mx-auto">
              Tu catálogo está pre-configurado para{" "}
              <span className="font-bold text-blue-600">
                máximas conversiones
              </span>
              . Solo personaliza los precios y ¡empieza a vender más!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-[#222222] mb-2 text-lg">
                1. Email
              </h4>
              <p className="text-sm text-[#666666] leading-relaxed">
                Pon tu email y recibe todo listo. ¡Gratis y en segundos!
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-[#222222] mb-2 text-lg">
                2. Selección
              </h4>
              <p className="text-sm text-[#666666] leading-relaxed">
                Todo está seleccionado para máximo alcance. ¡Más productos = Más
                ventas!
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-[#222222] mb-2 text-lg">
                3. Precios
              </h4>
              <p className="text-sm text-[#666666] leading-relaxed">
                Configura márgenes inteligentes. ¡Cada % es dinero extra!
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-[#222222] mb-2 text-lg">
                4. ¡Listo!
              </h4>
              <p className="text-sm text-[#666666] leading-relaxed">
                Recibe tu PDF profesional. ¡Empieza a vender inmediatamente!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mensaje final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mb-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-[#222222] mb-4 flex items-center justify-center gap-3">
                  <span className="text-4xl">�</span>
                  ¿Por qué miles de vendedores eligen nuestros catálogos?
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h4 className="font-bold text-[#222222] mb-2 text-lg">
                    Más Ganancias
                  </h4>
                  <p className="text-sm text-[#666666] leading-relaxed">
                    Precios inteligentes que aumentan tus márgenes. ¡Cada
                    catálogo genera más ventas!
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <h4 className="font-bold text-[#222222] mb-2 text-lg">
                    Ultra Rápido
                  </h4>
                  <p className="text-sm text-[#666666] leading-relaxed">
                    De 0 a catálogo profesional en 2 minutos. ¡Sin esperas ni
                    complicaciones!
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h4 className="font-bold text-[#222222] mb-2 text-lg">
                    Máximo Alcance
                  </h4>
                  <p className="text-sm text-[#666666] leading-relaxed">
                    Todas las categorías incluidas por defecto. ¡Más productos =
                    Más oportunidades!
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-blue-200 shadow-lg">
                  <span className="text-2xl">👥</span>
                  <span className="font-bold text-[#222222]">
                    1,247 vendedores
                  </span>
                  <span className="text-[#666666]">
                    ya aumentaron sus ganancias esta semana
                  </span>
                </div>
              </div>
            </div>

            <div className="text-6xl mb-6">🚀💰</div>
            <h2 className="text-4xl font-bold text-[#222222] mb-4">
              ¿Listo para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                revolucionar
              </span>{" "}
              tus ventas?
            </h2>
            <p className="text-[#666666] text-xl leading-relaxed mb-6">
              Tu catálogo profesional te espera. Cada catálogo que generes es
              una oportunidad para aumentar tus márgenes de ganancia y vender
              más.
              <span className="font-bold text-green-600">
                ¡El éxito está a solo un clic de distancia!
              </span>
            </p>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200 inline-block mb-6">
              <p className="text-[#222222] font-bold text-lg flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                ¡No esperes más! Tu competencia ya está usando catálogos
                inteligentes para vender más.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CatalogPage;
