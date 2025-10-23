import { UpdateMaintenance } from "@/interfaces/maintenance";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchMaintenance, updateMaintenance } from "@/redux/slices/maintenanceSlice";
import { useEffect } from "react";

export const useMaintenance = () => {
  const dispatch = useAppDispatch();
  const { maintenance, loading, error } = useAppSelector((state) => state.maintenance);

  useEffect(() => {
    if (!maintenance) {
      dispatch(fetchMaintenance());
    }
  }, [dispatch, maintenance]);

  const updateMaintenanceState = (config: UpdateMaintenance) => {
    dispatch(updateMaintenance(config));
  };

  return { maintenance, loading, error, updateMaintenanceState };
};