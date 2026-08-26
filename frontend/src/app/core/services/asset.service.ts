import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetDto, AssetDetailDto, PagedResult } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private readonly http = inject(HttpClient);
   private readonly apiUrl = `${environment.apiUrl}/assets`;

  getAssets(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    categoryId?: string,
    status?: string
  ): Observable<PagedResult<AssetDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PagedResult<AssetDto>>(this.apiUrl, { params });
  }

  getAssetById(id: string): Observable<AssetDetailDto> {
    return this.http.get<AssetDetailDto>(`${this.apiUrl}/${id}`);
  }

  createAsset(asset: any): Observable<AssetDto> {
    return this.http.post<AssetDto>(this.apiUrl, asset);
  }

  updateAsset(id: string, asset: any): Observable<AssetDto> {
    return this.http.put<AssetDto>(`${this.apiUrl}/${id}`, asset);
  }

  assignAsset(id: string, organizationUnitId: string): Observable<AssetDto> {
    return this.http.put<AssetDto>(`${this.apiUrl}/${id}/assign`, { organizationUnitId });
  }

  deleteAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
