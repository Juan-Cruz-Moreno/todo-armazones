import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de Clientes - Panel de Administración",
  description: "Gestiona y visualiza todos los clientes registrados en el panel administrativo",
};

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
