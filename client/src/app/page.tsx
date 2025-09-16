import { Suspense } from 'react';
import ProductList from "@/components/organisms/ProductList";
import PageTransition from "@/components/atoms/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      <main>
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><span className="loading loading-spinner loading-lg"></span></div>}>
          <ProductList />
        </Suspense>
      </main>
    </PageTransition>
  );
}
