import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchDollar } from "@/redux/slices/dollarSlice";
import { useEffect } from "react";

export const useDollar = () => {
  const dispatch = useAppDispatch();
  const { dollar, loading, error } = useAppSelector((state) => state.dollar);

  useEffect(() => {
    if (!dollar) {
      dispatch(fetchDollar());
    }
  }, [dispatch, dollar]);

  return { dollar, loading, error };
};