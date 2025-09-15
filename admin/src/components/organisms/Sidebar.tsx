"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart,
  Package,
  BanknoteArrowDown,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ChartArea,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const handleLogout = () => logout(() => router.replace("/login"));
  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    { label: "Analítica", icon: <ChartArea size={20} />, href: "/analytics" },
    { label: "Pedidos", icon: <ShoppingCart size={20} />, href: "/orders" },
    { label: "Productos", icon: <Package size={20} />, href: "/products" },
    {
      label: "Gastos",
      icon: <BanknoteArrowDown size={20} />,
      href: "/expenses",
    },
    { label: "Clientes", icon: <Users size={20} />, href: "/customers" },
    {
      label: "Configuración",
      icon: <Settings size={20} />,
      href: "/configuration",
    },
  ];

  return (
    <>
      {/* Header para móvil */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-none shadow-none z-50 md:hidden flex items-center px-4">
        <button
          className="p-2 rounded-md text-black hover:bg-gray-100 transition"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link href="/">
          <Image
            src="/logo-todo-armazones.png"
            alt="Logo"
            width={150}
            height={50}
          />
        </Link>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-none shadow-none z-40 transform transition-transform duration-300
        ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:sticky md:top-0 md:block`}
      >
        <div className="p-6 pt-20 md:pt-6">
          {" "}
          {/* deja espacio para el header móvil */}
          <Image
            src="/logo-todo-armazones.png"
            alt="Logo"
            width={150}
            height={50}
            className="mb-6 hidden md:block"
          />
          <nav className="space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 text-gray-700 hover:text-black p-2 rounded-md hover:bg-gray-100 transition-colors`}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              className="w-full text-left flex items-center gap-3 text-gray-700 hover:text-black p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut />
              Cerrar sesión
            </button>
          </nav>
        </div>
      </aside>

      {/* Overlay para cerrar el menú en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-35 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
