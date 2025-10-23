export interface updateMaintenanceDTO {
  active?: boolean;
  image?: number;
  title?: string;
  subtitle?: string;
}

export interface maintenanceResponseDTO {
  active: boolean;
  image: number;
  title: string | undefined;
  subtitle: string | undefined;
  updatedAt: Date;
}
