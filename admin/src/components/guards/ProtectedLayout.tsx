"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/organisms/Sidebar";
import SessionGuard from "@/components/guards/SessionGuard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <main className="flex-1 p-6 pt-14 md:pt-6">{children}</main>;
  }

  return (
    <SessionGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 pt-14 md:pt-6">{children}</main>
      </div>
    </SessionGuard>
  );
}
