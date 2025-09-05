import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis Pedidos - Todo Armazones",
  description: "Revisa el estado de tus pedidos, historial de compras y detalles de envío en Todo Armazones.",
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
