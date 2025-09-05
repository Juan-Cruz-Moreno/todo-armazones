import { UpdateDollarConfig } from "@/interfaces/dollar";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchDollar, updateDollarConfig, updateDollarValue } from "@/redux/slices/dollarSlice";
import { useEffect } from "react";

export const useDollar = () => {
  const dispatch = useAppDispatch();
  const { dollar, loading, error } = useAppSelector((state) => state.dollar);

  useEffect(() => {
    if (!dollar) {
      dispatch(fetchDollar());
    }
  }, [dispatch, dollar]);

  const updateConfig = (config: UpdateDollarConfig) => {
    dispatch(updateDollarConfig(config));
  };

  // Nuevo método para forzar la actualización del valor del dólar
  const forceUpdateDollarValue = () => {
    dispatch(updateDollarValue());
  };

  return { dollar, loading, error, updateConfig, forceUpdateDollarValue };
};
