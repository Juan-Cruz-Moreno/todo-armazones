import type { Metadata } from "next";
import axiosInstance from "@/utils/axiosInstance";
import type { Product } from "@/interfaces/product";
import type { ApiResponse } from "@/types/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data } = await axiosInstance.get<ApiResponse<{ product: Product }>>(
      `/products/${slug}`
    );
    
    const product = data.data?.product;

    if (!product) {
      return {
        title: "Producto no encontrado - Todo Armazones",
        description: "El producto que buscas no está disponible en Todo Armazones.",
      };
    }

    const productName = `${product.productModel} ${product.sku}`;
    const categories = product.category.map(cat => cat.name).join(", ");

    return {
      title: `${productName} - Todo Armazones`,
      description: `${productName} - ${categories} | Productos ópticos de calidad en Todo Armazones. ${product.size ? `Tamaño: ${product.size}.` : ""} Disponible en múltiples colores.`,
      openGraph: {
        title: `${productName} - Todo Armazones`,
        description: `${productName} | Productos ópticos de calidad`,
        images: product.primaryImage ? [
          {
            url: `${process.env.NEXT_PUBLIC_API_URL}${product.primaryImage}`,
            width: 400,
            height: 400,
            alt: productName,
          }
        ] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${productName} - Todo Armazones`,
        description: `${productName}`,
        images: product.primaryImage ? [`${process.env.NEXT_PUBLIC_API_URL}${product.primaryImage}`] : [],
      },
    };
  } catch {
    return {
      title: "Producto - Todo Armazones",
      description: "Descubre productos ópticos de calidad en Todo Armazones.",
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
