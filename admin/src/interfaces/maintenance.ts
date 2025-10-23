export interface Maintenance {
  active: boolean;
  image: number;
  title?: string;
  subtitle?: string;
  updatedAt: Date;
}

export interface UpdateMaintenance {
  active?: boolean;
  image?: number;
  title?: string;
  subtitle?: string;
}