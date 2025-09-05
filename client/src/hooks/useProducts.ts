import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchProducts,
  fetchProductBySlug,
  searchProducts,
  clearProductDetail,
  clearSearchResults,
} from "../redux/slices/productSlice";

export const useProducts = () => {
  const dispatch = useAppDispatch();
  const {
    products,
    nextCursor,
    loading,
    error,
    productDetail,
    searchResults,
    searchLoading,
    searchError,
  } = useAppSelector((state) => state.products);

  return {
    products,
    nextCursor,
    loading,
    error,
    productDetail,
    searchResults,
    searchLoading,
    searchError,
    fetchProducts: (params?: {
      categorySlug?: string;
      subcategorySlug?: string;
      cursor?: string;
      limit?: number;
      inStock?: boolean;
    }) => dispatch(fetchProducts(params)),
    fetchProductBySlug: (slug: string) => dispatch(fetchProductBySlug(slug)),
    searchProducts: (q: string) => dispatch(searchProducts(q)),
    clearProductDetail: () => dispatch(clearProductDetail()),
    clearSearchResults: () => dispatch(clearSearchResults()),
  };
};
