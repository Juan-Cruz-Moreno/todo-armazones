// DTO para la creación de una categoría
export interface CreateCategoryRequestDto {
  readonly slug: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
}

// DTO para la respuesta de la creación de una categoría
export interface CreateCategoryResponseDTO {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
