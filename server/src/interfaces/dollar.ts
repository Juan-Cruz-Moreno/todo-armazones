export interface IDollar {
  baseValue: number;
  value: number;
  addedValue: number;
  isPercentage: boolean;
  source: 'bluelytics' | 'dolarapi';
  apiUpdatedAt: Date;
  updatedAt: Date;
}
