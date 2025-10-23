import Image from "next/image";
import type { Maintenance } from "@/interfaces/maintenance";

interface MaintenanceViewProps {
  maintenance: Maintenance;
}

// Server component: do NOT use client hooks here.
export default function MaintenanceView({ maintenance }: MaintenanceViewProps) {
  return (
    <div className="relative min-h-screen">
      <Image
        src={`/maintenance/${maintenance?.image || 1}.jpg`}
        alt="Página en mantenimiento"
        fill
        className="object-cover w-full h-full"
        priority
      />

      <div className="absolute inset-0 bg-black/40" />

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

          <div className="pb-6 text-center text-sm text-white/90">
            <p>&copy; 2025 Todo Armazones. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
