import PageTransition from "@/components/atoms/PageTransition";
import ProductList from "@/components/organisms/ProductList";
import { Suspense } from "react";

const StorePage = () => {
  return (
    <PageTransition>
      <main>
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-screen">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          <ProductList />
        </Suspense>
      </main>
    </PageTransition>
  );
};

export default StorePage;