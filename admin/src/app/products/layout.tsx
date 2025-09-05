import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Productos - Panel de Administración",
  description: "Gestiona el catálogo de productos, precios, stock y categorías en el panel administrativo",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
