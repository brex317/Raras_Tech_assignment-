import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetCategoryDto } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5165/api/categories';

  getCategories(): Observable<AssetCategoryDto[]> {
    return this.http.get<AssetCategoryDto[]>(this.apiUrl);
  }
}
