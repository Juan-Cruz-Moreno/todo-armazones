"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface MobileCategoryHeaderProps {
  categoryName: string;
  categorySlug: string;
  subcategoryName?: string;
  subcategorySlug?: string;
}

const MobileCategoryHeader = ({
  categoryName,
  categorySlug,
  subcategoryName,
  subcategorySlug,
}: MobileCategoryHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 py-4 px-4 sm:hidden">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-gray-700 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/categorias/${categorySlug}`}
            className="hover:text-gray-700 transition-colors"
          >
            {categoryName}
          </Link>
          {subcategoryName && subcategorySlug && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-700 font-medium">
                {subcategoryName}
              </span>
            </>
          )}
        </nav>

        {/* Título principal */}
        <h1 className="text-lg font-bold text-gray-900 leading-tight">
          {subcategoryName
            ? `${subcategoryName} para ${categoryName}`
            : categoryName}
        </h1>
      </div>
    </div>
  );
};

export default MobileCategoryHeader;
