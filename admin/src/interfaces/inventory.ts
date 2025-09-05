export enum StockMovementType {
  ENTRY = 'ENTRY',           // Entrada de stock (compra)
  EXIT = 'EXIT',             // Salida de stock (venta)
  ADJUSTMENT = 'ADJUSTMENT', // Ajuste de inventario
  INITIAL = 'INITIAL',       // Stock inicial
}

export enum StockMovementReason {
  PURCHASE = 'PURCHASE',               // Compra
  SALE = 'SALE',                      // Venta
  RETURN = 'RETURN',                  // Devolución
  DAMAGE = 'DAMAGE',                  // Daño
  THEFT = 'THEFT',                    // Robo
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT', // Ajuste de inventario
  INITIAL_STOCK = 'INITIAL_STOCK',    // Stock inicial
}

export interface StockMovement {
  id: string;
  productVariant: {
    id: string;
    color: { name: string; hex: string };
    product: {
      id: string;
      productModel: string;
      sku: string;
    };
  };
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  unitCost: number;
  totalCost: number;
  previousStock: number;
  newStock: number;
  previousAvgCost: number;
  newAvgCost: number;
  reference?: string;
  notes?: string;
  createdBy?: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
}

export interface StockMovementHistory {
  movements: StockMovement[];
  totalMovements: number;
}

export interface ProductVariantStockSummary {
  id: string;
  color: { name: string; hex: string };
  currentStock: number;
  averageCostUSD: number;
  totalValue: number; // currentStock * averageCostUSD
  lastMovement?: {
    date: string;
    type: StockMovementType;
    quantity: number;
  };
}

export interface CreateStockEntryPayload {
  productVariantId: string;
  quantity: number;
  unitCost?: number;
  reason: StockMovementReason;
  reference?: string;
  notes?: string;
}

export interface CreateStockExitPayload {
  productVariantId: string;
  quantity: number;
  reason: StockMovementReason;
  reference?: string;
  notes?: string;
}

export interface StockMovementResponse {
  id: string;
  productVariantId: string;
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  unitCost: number;
  totalCost: number;
  previousStock: number;
  newStock: number;
  previousAvgCost: number;
  newAvgCost: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}
