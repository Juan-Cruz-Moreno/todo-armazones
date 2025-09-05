import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Producto - Panel de Administración",
  description: "Crea un nuevo producto con variantes, colores, stock e imágenes en el catálogo",
};

export default function CreateProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
