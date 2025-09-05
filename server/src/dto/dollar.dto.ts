export interface updateDollarAddedValueDTO {
  addedValue: number;
  isPercentage: boolean;
}

export interface dollarResponseDTO {
  baseValue: number;
  value: number;
  addedValue: number;
  isPercentage: boolean;
  source: 'bluelytics' | 'dolarapi';
  apiUpdatedAt: Date;
  updatedAt: Date;
}
