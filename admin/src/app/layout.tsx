import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/redux/ReduxProvider";
import ProtectedLayout from "@/components/guards/ProtectedLayout";

export const metadata: Metadata = {
  title: "Panel de Administración - Todo Armazones Argentina",
  description:
    "Panel de administración para gestionar e-commerce - Todo Armazones Argentina",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ReduxProvider>
          <ProtectedLayout>{children}</ProtectedLayout>
        </ReduxProvider>
      </body>
    </html>
  );
}
