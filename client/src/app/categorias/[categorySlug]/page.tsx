// app/categorias/[categorySlug]/page.tsx

import ProductList from "@/components/organisms/ProductList";
import MobileCategoryHeader from "@/components/molecules/MobileCategoryHeader";
import PageTransition from "@/components/atoms/PageTransition";

// Función para obtener información de categoría en el servidor
function getCategoryInfo(categorySlug: string) {
  const categories = [
    {
      name: "Hombres",
      slug: "hombres",
      subcategories: [
        { name: "Anteojos de sol", slug: "anteojos-de-sol-polarizados" },
        { name: "Armazón de receta", slug: "armazon-de-receta" },
        { name: "Clip on", slug: "clip-on" },
      ],
    },
    {
      name: "Mujeres",
      slug: "mujeres",
      subcategories: [
        { name: "Anteojos de sol", slug: "anteojos-de-sol-polarizados" },
        { name: "Armazón de receta", slug: "armazon-de-receta" },
        { name: "Clip on", slug: "clip-on" },
      ],
    },
    {
      name: "Niños",
      slug: "ninos",
      subcategories: [
        {
          name: "Anteojos de sol polarizados",
          slug: "anteojos-de-sol-polarizados",
        },
        { name: "Armazón de receta", slug: "armazon-de-receta" },
        { name: "Clip on", slug: "clip-on" },
      ],
    },
  ];

  return categories.find((cat) => cat.slug === categorySlug);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const categoryInfo = getCategoryInfo(categorySlug);

  if (!categoryInfo) {
    return <div>Categoría no encontrada</div>;
  }

  return (
    <PageTransition>
      <main>
        <MobileCategoryHeader
          categoryName={categoryInfo.name}
          categorySlug={categoryInfo.slug}
        />
        <ProductList categorySlug={categorySlug} />
      </main>
    </PageTransition>
  );
}
