"use client";

import { useMaintenance } from "@/hooks/useMaintenance";
import Navbar from "@/components/organisms/Navbar";
import Footer from "@/components/organisms/Footer";

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const { maintenance, loading } = useMaintenance();

  // Si estamos en modo mantenimiento, no mostrar navbar/footer
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center" role="status" aria-busy="true">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (maintenance?.active) {
    return <>{children}</>;
  }

  // Contenido normal con navbar/footer
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}