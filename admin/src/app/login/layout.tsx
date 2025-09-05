import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión - Panel de Administración",
  description: "Accede al panel de administración de Todo Armazones Argentina",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
