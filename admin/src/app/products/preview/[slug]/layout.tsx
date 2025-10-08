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
        title: "Producto no encontrado - Admin Todo Armazones",
        description: "El producto que buscas no está disponible.",
      };
    }

    const productName = `${product.productModel} ${product.sku}`;
    const categories = product.category.map(cat => cat.name).join(", ");

    return {
      title: `${productName} - Preview Admin`,
      description: `${productName} - ${categories} | Vista previa de producto en Todo Armazones Admin.`,
      openGraph: {
        title: `${productName} - Preview Admin`,
        description: `${productName} | Vista previa`,
        images: product.primaryImage && product.primaryImage.length > 0 ? [
          {
            url: `${process.env.NEXT_PUBLIC_API_URL}${product.primaryImage[0]}`,
            width: 400,
            height: 400,
            alt: productName,
          }
        ] : [],
      },
    };
  } catch {
    return {
      title: "Producto - Admin Todo Armazones",
      description: "Vista previa de producto en Todo Armazones Admin.",
    };
  }
}

export default function PreviewProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
