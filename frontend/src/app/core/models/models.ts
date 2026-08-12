export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organizationUnitName?: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
}

export interface AssetDto {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  status: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiryDate?: string;
  createdAt: string;
  updatedAt?: string;
  categoryId: string;
  categoryName: string;
  organizationUnitId: string;
  organizationUnitName: string;
  documentCount: number;
}

export interface AssetHistoryDto {
  id: string;
  changeType: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  changedByUserName: string;
}

export interface AssetDocumentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  documentType: string;
  uploadedAt: string;
  uploadedByUserName: string;
}

export interface AssetDetailDto extends AssetDto {
  history: AssetHistoryDto[];
  documents: AssetDocumentDto[];
}

export interface OrganizationUnitDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  parentId?: string;
  parentName?: string;
  level: number;
  assetCount: number;
}

export interface OrganizationUnitTreeDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  level: number;
  assetCount: number;
  children: OrganizationUnitTreeDto[];
}

export interface AssetCategoryDto {
  id: string;
  name: string;
  description?: string;
  assetCount: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
