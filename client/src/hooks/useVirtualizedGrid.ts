import { useEffect, useState, useMemo } from "react";

interface UseVirtualizedGridOptions {
  /** Altura base estimada para cada fila */
  baseRowHeight?: number;
  /** Padding adicional para cada fila */
  rowPadding?: number;
  /** Número de columnas por fila según breakpoints */
  responsive?: {
    sm: number;  // < 768px
    md: number;  // >= 768px && < 1280px  
    xl: number;  // >= 1280px
  };
}

const DEFAULT_OPTIONS: Required<UseVirtualizedGridOptions> = {
  baseRowHeight: 380,
  rowPadding: 40,
  responsive: {
    sm: 2,
    md: 3,
    xl: 4,
  },
};

export const useVirtualizedGrid = (options: UseVirtualizedGridOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [itemsPerRow, setItemsPerRow] = useState(config.responsive.sm);
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 120px)");

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      
      if (width >= 1280) {
        setItemsPerRow(config.responsive.xl);
      } else if (width >= 768) {
        setItemsPerRow(config.responsive.md);
      } else {
        setItemsPerRow(config.responsive.sm);
      }

      // Ajustar altura del contenedor según disponibilidad
      const availableHeight = window.innerHeight;
      const headerHeight = 80; // Estimado del header
      const paddingHeight = 40; // Padding del contenedor
      const calculatedHeight = availableHeight - headerHeight - paddingHeight;
      
      setContainerHeight(`${Math.max(calculatedHeight, 400)}px`);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [config.responsive]);

  // Calcular altura total de fila
  const rowHeight = useMemo(() => {
    return config.baseRowHeight + config.rowPadding;
  }, [config.baseRowHeight, config.rowPadding]);

  // Calcular número de filas necesarias
  const calculateRows = (totalItems: number): number => {
    return Math.ceil(totalItems / itemsPerRow);
  };

  // Obtener índices de elementos para una fila específica
  const getRowItems = (rowIndex: number, totalItems: number) => {
    const startIndex = rowIndex * itemsPerRow;
    const endIndex = Math.min(startIndex + itemsPerRow, totalItems);
    return { startIndex, endIndex, count: endIndex - startIndex };
  };

  return {
    itemsPerRow,
    rowHeight,
    containerHeight,
    calculateRows,
    getRowItems,
    // Configuración para react-window List
    listConfig: {
      rowHeight,
      overscanCount: 2,
      style: {
        height: containerHeight,
        width: "100%",
      },
    },
  };
};