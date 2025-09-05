import { Types } from 'mongoose';

export enum StockMovementType {
  ENTRY = 'ENTRY', // Entrada de stock (compra)
  EXIT = 'EXIT', // Salida de stock (venta)
  ADJUSTMENT = 'ADJUSTMENT', // Ajuste de inventario
  INITIAL = 'INITIAL', // Stock inicial
}

export enum StockMovementReason {
  PURCHASE = 'PURCHASE', // Compra
  SALE = 'SALE', // Venta
  RETURN = 'RETURN', // Devolución
  DAMAGE = 'DAMAGE', // Daño
  THEFT = 'THEFT', // Robo
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT', // Ajuste de inventario
  INITIAL_STOCK = 'INITIAL_STOCK', // Stock inicial
}

export interface IStockMovement {
  productVariant: Types.ObjectId;
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  unitCost: number; // Costo unitario de esta entrada
  totalCost: number; // Costo total (quantity * unitCost)
  previousStock: number; // Stock anterior
  newStock: number; // Stock después del movimiento
  previousAvgCost: number; // Costo promedio anterior
  newAvgCost: number; // Nuevo costo promedio (después del CPP)
  reference?: string; // Referencia externa (ej: número de factura)
  notes?: string; // Notas adicionales
  createdBy?: Types.ObjectId; // Usuario que realizó el movimiento
}
