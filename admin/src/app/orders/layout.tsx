import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Órdenes de Clientes - Panel de Administración",
  description: "Gestiona y visualiza todas las órdenes de clientes en el panel administrativo",
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
