import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout - Todo Armazones",
  description: "Finaliza tu compra de productos ópticos de calidad. Ingresa tus datos de envío y completa tu pedido.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
