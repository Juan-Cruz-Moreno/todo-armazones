import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restablecer Contraseña - Todo Armazones",
  description: "Crea una nueva contraseña segura para tu cuenta de Todo Armazones",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
