import PageTransition from "@/components/atoms/PageTransition";
import SearchProductList from "@/components/organisms/SearchProductList";
import { Suspense } from "react";

const SearchPage = () => {
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
          <SearchProductList />
        </Suspense>
      </main>
    </PageTransition>
  );
};

export default SearchPage;
