import {
  CreateProductPayload,
  UpdateProductPayload,
  BulkPriceUpdatePayload,
} from "@/interfaces/product";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchProducts,
  searchProducts,
  clearSearchResults,
  createProduct,
  updateProduct,
  bulkUpdatePrices,
  clearBulkUpdateError,
} from "../redux/slices/productSlice";

export const useProducts = () => {
  const dispatch = useAppDispatch();
  const {
    products,
    nextCursor,
    loading,
    error,
    searchResults,
    searchLoading,
    searchError,
    bulkUpdateLoading,
    bulkUpdateError,
  } = useAppSelector((state) => state.products);

  return {
    products,
    nextCursor,
    loading,
    error,
    searchResults,
    searchLoading,
    searchError,
    bulkUpdateLoading,
    bulkUpdateError,
    fetchProducts: (params?: {
      categorySlug?: string;
      subcategorySlug?: string;
      cursor?: string;
      limit?: number;
    }) => dispatch(fetchProducts(params)),
    searchProducts: (q: string) => dispatch(searchProducts(q)),
    clearSearchResults: () => dispatch(clearSearchResults()),
    createProduct: (payload: CreateProductPayload) =>
      dispatch(createProduct(payload)),
    updateProduct: (payload: UpdateProductPayload) =>
      dispatch(updateProduct(payload)),
    bulkUpdatePrices: (payload: BulkPriceUpdatePayload) =>
      dispatch(bulkUpdatePrices(payload)),
    clearBulkUpdateError: () => dispatch(clearBulkUpdateError()),
  };
};
