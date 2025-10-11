import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerta de Stock Bajo - Panel de Administración",
  description: "Visualiza y gestiona productos con stock crítico que requieren reposición",
};

export default function StockThresholdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
