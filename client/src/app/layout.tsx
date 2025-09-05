import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/organisms/Navbar";
import Footer from "@/components/organisms/Footer";
import ReduxProvider from "@/redux/ReduxProvider";

export const metadata: Metadata = {
  title: "Todo Armazones – Importadores Mayoristas de Insumos Opticos",
  description:
    "Pioneros en ofrecer productos de calidad y al mejor precio del mercado.",
  robots: {
    index: false,
    follow: false,
  },
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
          <Navbar />
          {children}
          <Footer />
        </ReduxProvider>
      </body>
    </html>
  );
}
