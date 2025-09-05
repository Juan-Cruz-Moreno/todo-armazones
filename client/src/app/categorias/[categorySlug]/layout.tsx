import type { Metadata } from "next";

// Función para convertir slug a nombre legible
function slugToName(slug: string): string {
  const slugMap: Record<string, string> = {
    'hombres': 'Hombres',
    'mujeres': 'Mujeres',
    'ninos': 'Niños',
    // Agrega más mapeos según tus categorías
  };
  
  return slugMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const categoryName = slugToName(categorySlug);

  return {
    title: `${categoryName} - Todo Armazones`,
    description: `Descubre nuestra amplia selección de productos ópticos para ${categoryName.toLowerCase()} en Todo Armazones. Productos de calidad al mejor precio del mercado.`,
    openGraph: {
      title: `${categoryName} - Todo Armazones`,
      description: `Productos ópticos para ${categoryName.toLowerCase()} - Todo Armazones`,
    },
    twitter: {
      card: "summary",
      title: `${categoryName} - Todo Armazones`,
      description: `Productos ópticos para ${categoryName.toLowerCase()}`,
    },
  };
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
