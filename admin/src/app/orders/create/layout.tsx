import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Orden - Panel de Administración",
  description:
    "Crea y gestiona nuevas órdenes de clientes en el panel administrativo",
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
