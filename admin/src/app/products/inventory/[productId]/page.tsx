"use client";
import React from "react";
import { InventoryManager } from "../../../../components/inventory";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface InventoryPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default function ProductInventoryPage({ params }: InventoryPageProps) {
  const { productId } = React.use(params);

  return (
    <div className="px-4 py-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/products">
            <button className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none">
              <ChevronLeft className="size-4 mr-2 text-[#222222]" />
              <span className="text-[#222222]">Volver a Productos</span>
            </button>
          </Link>

          <Link href={`/products/edit/${productId}`}>
            <button className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none">
              <svg
                className="size-4 mr-2 text-[#222222]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="text-[#222222]">Editar Producto</span>
            </button>
          </Link>
        </div>

        <h1 className="text-[#111111] font-bold text-3xl">
          Gestión de Inventario
        </h1>
        <p className="text-[#666666] mt-2">
          Administra el stock y movimientos de inventario con sistema CPP (Costo
          Promedio Ponderado)
        </p>
      </div>

      {/* Inventory Manager Component */}
      <InventoryManager productId={productId} />
    </div>
  );
}
