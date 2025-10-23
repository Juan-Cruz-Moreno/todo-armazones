"use client";

import { useMaintenance } from "@/hooks/useMaintenance";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { maintenance, loading } = useMaintenance();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si está cargando, no hacer nada aún
    if (loading) return;

    // Si maintenance está activo y no estamos en la página de maintenance
    if (maintenance?.active && pathname !== "/maintenance") {
      // Use replace (no history entry) to avoid user returning to a page
      // that should be blocked while maintenance is active. Add a short
      // fade for perceptual smoothness before navigation.
      try {
        document.documentElement.classList.add("site-fade-out");
      } catch {
        // ignore if document not available for some reason
      }
      setTimeout(() => {
        router.replace("/maintenance");
      }, 180);
      return;
    }

    // Si maintenance no está activo y estamos en la página de maintenance
    if (!maintenance?.active && pathname === "/maintenance") {
      // Going back to the app, use replace to clear maintenance route and
      // apply a short fade for smoothness.
      try {
        document.documentElement.classList.add("site-fade-out");
      } catch {
        // ignore
      }
      setTimeout(() => {
        router.replace("/");
      }, 120);
      return;
    }
  }, [maintenance, loading, pathname, router]);

  // Siempre mostrar el contenido (la verificación se maneja en background)
  return <>{children}</>;
}