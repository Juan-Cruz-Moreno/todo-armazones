import type { Metadata } from "next";

// Función para convertir slug a nombre legible
function slugToName(slug: string): string {
  const slugMap: Record<string, string> = {
    // Categorías
    'hombres': 'Hombres',
    'mujeres': 'Mujeres',
    'ninos': 'Niños',
    // Subcategorías
    'anteojos-de-sol-polarizados': 'Anteojos de Sol Polarizados',
    'armazon-de-receta': 'Armazón de Receta',
    'clip-on': 'Clip On',
    // Agrega más mapeos según tus categorías y subcategorías
  };
  
  return slugMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const categoryName = slugToName(categorySlug);
  const subcategoryName = slugToName(subcategorySlug);

  return {
    title: `${subcategoryName} para ${categoryName} - Todo Armazones`,
    description: `Encuentra los mejores ${subcategoryName.toLowerCase()} para ${categoryName.toLowerCase()} en Todo Armazones. Productos ópticos de calidad con la mejor relación precio-calidad del mercado.`,
    openGraph: {
      title: `${subcategoryName} para ${categoryName} - Todo Armazones`,
      description: `Los mejores ${subcategoryName.toLowerCase()} para ${categoryName.toLowerCase()} - Todo Armazones`,
    },
    twitter: {
      card: "summary",
      title: `${subcategoryName} para ${categoryName} - Todo Armazones`,
      description: `Los mejores ${subcategoryName.toLowerCase()} para ${categoryName.toLowerCase()}`,
    },
  };
}

export default function CategorySubcategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
