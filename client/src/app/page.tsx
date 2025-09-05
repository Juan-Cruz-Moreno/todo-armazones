import ProductList from "@/components/organisms/ProductList";
import PageTransition from "@/components/atoms/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      <main>
        <ProductList />
      </main>
    </PageTransition>
  );
}
