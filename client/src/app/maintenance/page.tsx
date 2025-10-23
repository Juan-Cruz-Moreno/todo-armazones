"use client";

import { useMaintenance } from "@/hooks/useMaintenance";
import Image from "next/image";

export default function MaintenancePage() {
  const { maintenance, loading, error } = useMaintenance();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Error al cargar la página
          </h1>
          <p className="text-gray-600">
            Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background image filling the viewport */}
      <Image
        src={`/maintenance/${maintenance?.image || 1}.jpg`}
        alt="Página en mantenimiento"
        fill
        className="object-cover w-full h-full"
        priority
      />

      {/* Subtle dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Overlayed content: title & subtitle vertically centered */}
      <div className="relative z-10 min-h-screen px-4">
        <div className="flex flex-col min-h-screen">
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center text-white px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight drop-shadow">
                {maintenance?.title || "Sistema en Mantenimiento"}
              </h1>

              {maintenance?.subtitle && (
                <p className="text-lg md:text-xl max-w-lg mx-auto leading-relaxed drop-shadow">
                  {maintenance.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Footer (kept simple and discreet) */}
          <div className="pb-6 text-center text-sm text-white/90">
            <p>&copy; 2025 Todo Armazones. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}