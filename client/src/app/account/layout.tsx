import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Cuenta - Todo Armazones",
  description: "Inicia sesión o crea una cuenta nueva en Todo Armazones para realizar tus compras y gestionar tus pedidos.",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
