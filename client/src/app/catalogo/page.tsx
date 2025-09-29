"use client";

import { useCatalog } from "@/hooks/useCatalog";
import { Category, Subcategory } from "@/interfaces/catalog";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import PriceAdjustments from "@/components/catalog/PriceAdjustments";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import { Controller } from "react-hook-form";

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
    showPrices,
  } = useCatalog();

  const {
    loading,
    logoPreview,
    progress,
    pdfFileName,
    isProgressModalOpen,
    currentStep,
    progressMessage,
    modalError,
    completed,
  } = state;

  const {
    handleLogoChange,
    removeLogo,
    handleCategoryChange,
    handleSubcategoryChange,
    clearSuccess,
    clearModalError,
    addPriceAdjustment,
    removePriceAdjustment,
    updatePriceAdjustment,
    downloadPdf,
    closeProgressModal,
    onSubmit,
  } = handlers;

  const { handleSubmit } = form;

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
                  en tiempo real!
                </h1>
                <p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto mb-6">
                  Genera un PDF profesional con precios que{" "}
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
                        ¡Solo 4 pasos para vender más!
                      </h2>
                      <p className="text-[#666666]">
                        Selecciona → Personaliza → Configura → ¡Genera tu
                        catálogo!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Categorías */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#222222] flex items-center justify-center gap-3 mb-2">
                    🎯 Paso 1: ¿A quién vendes?
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
                    📦 Paso 2: ¿Qué productos ofreces?
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

              {/* Personalización y Opciones */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#222222] flex items-center justify-center gap-3 mb-2">
                    🎨 Paso 3: Personalización (Opcional)
                  </h3>
                  <p className="text-[#666666] mb-4">
                    Haz que tu catálogo luzca único con tu logo
                  </p>
                </div>

                {/* Logo Upload */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 max-w-2xl mx-auto">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">✨</div>
                    <h4 className="text-lg font-bold text-[#222222] mb-2">
                      Logo personalizado
                    </h4>
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
                        <Image
                          src={logoPreview}
                          alt="Preview del logo"
                          width={200}
                          height={200}
                          className="w-auto h-auto max-h-[200px] object-contain"
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

                {/* Opciones del Catálogo */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-bold text-[#222222] mb-2">
                      Opciones del catálogo
                    </h4>
                    <p className="text-sm text-[#666666]">
                      Configura cómo se mostrará tu catálogo
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Controller
                      name="showPrices"
                      control={form.control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <input
                          type="checkbox"
                          {...field}
                          checked={value ?? false}
                          onChange={(e) => onChange(e.target.checked)}
                          className="checkbox checkbox-success checkbox-lg"
                        />
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-[#222222] text-lg mb-1">
                        Mostrar precios en el catálogo
                      </div>
                      <p className="text-sm text-[#666666]">
                        Incluye precios en USD y ARS en el PDF generado. Si
                        desactivas, solo se mostrarán los productos sin precios.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ajustes de Precio */}
              {showPrices && (
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
                            35% de incremento = $10 → $13.5 ¡Más dinero en tu
                            bolsillo!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <PriceAdjustments
                      priceAdjustments={priceAdjustments}
                      categories={categories.filter((cat) =>
                        selectedCategories.includes(cat.id)
                      )}
                      subcategories={filteredSubcategories}
                      onAdd={addPriceAdjustment}
                      onRemove={removePriceAdjustment}
                      onUpdate={updatePriceAdjustment}
                    />
                  </div>
                </div>
              )}

              {/* Alertas de estado - cerca del botón */}
              {/* Catálogo listo para descargar */}
              <AnimatePresence>
                {pdfFileName && !loading && (
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
                        Tu PDF personalizado ha sido generado exitosamente. Haz
                        clic en el botón para descargarlo.
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800 mb-2">
                          <span className="text-lg">⚡</span>
                          <span className="font-semibold">
                            ¡Tu catálogo está listo para descargar!
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          Descarga tu PDF profesional y comienza a vender
                          inmediatamente. ¡El éxito te espera! 🚀
                        </p>
                      </div>
                      <button
                        onClick={downloadPdf}
                        className="btn btn-success btn-sm mt-3"
                      >
                        📥 Descargar PDF
                      </button>
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

              {/* Botón de envío */}
              <div className="flex justify-center pt-8 border-t border-[#e1e1e1]">
                <div className="text-center w-full max-w-sm md:max-w-none">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`btn btn-lg border-none rounded-2xl px-4 py-3 md:px-12 md:py-6 text-base md:text-xl font-bold transition-all duration-300 transform shadow-2xl w-full ${
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
                        <div className="flex items-center justify-center gap-2 md:gap-4">
                          <div className="text-left">
                            <div className="text-white text-base md:text-lg font-bold">
                              <span className="hidden md:inline">🚀 </span>¡CREA
                              MI CATÁLOGO GRATIS!
                            </div>
                          </div>
                          <span className="hidden md:inline text-2xl md:text-3xl">
                            💰
                          </span>
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

        {/* Mensaje final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="max-w-4xl mx-auto">
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
              <p className="text-[#222222] font-bold text-lg flex flex-col md:flex-row items-center gap-2">
                <span className="text-2xl">⚡</span>
                ¡No esperes más! Tu competencia ya está usando catálogos
                inteligentes para vender más.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de Progreso */}
      <AnimatePresence>
        {isProgressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={closeProgressModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {modalError ? (
                  // Vista de error
                  <>
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-2xl font-bold text-red-600 mb-4">
                      ¡Oops! Algo salió mal
                    </h3>
                    <p className="text-[#666666] mb-6">{modalError}</p>
                    <div className="flex flex-col gap-3 items-center">
                      <button
                        onClick={clearModalError}
                        className="btn btn-neutral btn-sm"
                      >
                        Cerrar
                      </button>
                      <button
                        onClick={() => {
                          clearModalError();
                          // Opcional: resetear form o algo para reintentar
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  </>
                ) : completed ? (
                  // Vista de completado
                  <>
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">
                      ¡Catálogo generado exitosamente!
                    </h3>
                    <p className="text-[#666666] mb-6">
                      Tu PDF está listo para descargar.
                    </p>
                    <div className="flex flex-col gap-3 items-center">
                      <button
                        onClick={downloadPdf}
                        className="btn btn-primary btn-sm"
                      >
                        Descargar PDF
                      </button>
                      <button
                        onClick={closeProgressModal}
                        className="btn btn-neutral btn-sm"
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                ) : (
                  // Vista de progreso normal
                  <>
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LoadingSpinner size="sm" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#222222] mb-2">
                      Generando tu catálogo
                    </h3>
                    <p className="text-[#666666] mb-6">
                      {progressMessage || "Procesando tu solicitud..."}
                    </p>
                    <p className="text-sm text-orange-600 font-medium mb-4">
                      ⚠️ Por favor, no cierres esta página mientras se genera tu
                      catálogo.
                    </p>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <motion.div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    <div className="text-sm text-[#666666] mb-4">
                      {progress}% completado
                    </div>

                    {currentStep && (
                      <div className="text-sm font-medium text-[#222222] bg-gray-50 px-3 py-2 rounded-lg">
                        Paso actual: {currentStep}
                      </div>
                    )}

                    <div className="mt-6">
                      <button
                        onClick={closeProgressModal}
                        className="btn btn-neutral btn-sm"
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CatalogPage;
