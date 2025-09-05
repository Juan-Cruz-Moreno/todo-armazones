export interface Dollar {
  baseValue: number;
  value: number;
  addedValue: number;
  isPercentage: boolean;
  source: "bluelytics" | "dolarapi";
  apiUpdatedAt: Date;
  updatedAt: Date;
}

export interface UpdateDollarConfig {
  addedValue: number;
  isPercentage: boolean;
}
