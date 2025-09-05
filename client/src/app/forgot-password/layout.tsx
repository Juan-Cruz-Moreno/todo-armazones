import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar Contraseña - Todo Armazones",
  description: "Recupera el acceso a tu cuenta de Todo Armazones. Ingresa tu email para recibir un enlace de recuperación.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
