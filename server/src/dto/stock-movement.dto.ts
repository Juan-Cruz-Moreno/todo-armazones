import { Types } from 'mongoose';
import { StockMovementType, StockMovementReason } from '@interfaces/stockMovement';

export interface CreateStockEntryRequestDto {
  productVariantId: Types.ObjectId;
  quantity: number;
  unitCost?: number; // Opcional para RETURN e INVENTORY_ADJUSTMENT
  reason: StockMovementReason;
  reference?: string;
  notes?: string;
}

export interface CreateStockEntryResponseDto {
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
  reference?: string | undefined;
  notes?: string | undefined;
  createdAt: Date;
}

export interface StockMovementListItemDto {
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
  createdBy?:
    | {
        id: string;
        displayName: string;
        email: string;
      }
    | undefined;
  createdAt: Date;
}

export interface StockMovementHistoryResponseDto {
  movements: StockMovementListItemDto[];
  totalMovements: number;
}

export interface ProductVariantStockSummaryDto {
  id: string;
  color: { name: string; hex: string };
  currentStock: number;
  averageCostUSD: number;
  totalValue: number; // currentStock * averageCostUSD
  lastMovement?:
    | {
        date: Date;
        type: StockMovementType;
        quantity: number;
      }
    | undefined;
}
