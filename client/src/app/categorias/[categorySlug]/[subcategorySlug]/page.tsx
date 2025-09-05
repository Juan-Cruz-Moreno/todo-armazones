// app/categorias/[categorySlug]/[subcategorySlug]/page.tsx

import ProductList from "@/components/organisms/ProductList";
import MobileCategoryHeader from "@/components/molecules/MobileCategoryHeader";
import PageTransition from "@/components/atoms/PageTransition";

// Función para obtener información de categoría y subcategoría en el servidor
function getCategoryAndSubcategoryInfo(
  categorySlug: string,
  subcategorySlug: string
) {
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

  const category = categories.find((cat) => cat.slug === categorySlug);
  const subcategory = category?.subcategories.find(
    (sub) => sub.slug === subcategorySlug
  );

  return { category, subcategory };
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
}) {
  const { categorySlug, subcategorySlug } = await params;
  const { category, subcategory } = getCategoryAndSubcategoryInfo(
    categorySlug,
    subcategorySlug
  );

  if (!category || !subcategory) {
    return <div>Categoría o subcategoría no encontrada</div>;
  }

  return (
    <PageTransition>
      <main>
        <MobileCategoryHeader
          categoryName={category.name}
          categorySlug={category.slug}
          subcategoryName={subcategory.name}
          subcategorySlug={subcategory.slug}
        />
        <ProductList
          categorySlug={categorySlug}
          subcategorySlug={subcategorySlug}
        />
      </main>
    </PageTransition>
  );
}
