import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editar Producto - Panel de Administración",
  description: "Modifica los datos, variantes, colores, stock e imágenes de un producto existente",
};

export default function EditProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
