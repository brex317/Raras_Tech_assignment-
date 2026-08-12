import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrganizationUnitDto, OrganizationUnitTreeDto } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class OrganizationUnitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5165/api/organizationunits';

  getTree(): Observable<OrganizationUnitTreeDto[]> {
    return this.http.get<OrganizationUnitTreeDto[]>(`${this.apiUrl}/tree`);
  }

  getAll(): Observable<OrganizationUnitDto[]> {
    return this.http.get<OrganizationUnitDto[]>(this.apiUrl);
  }

  getById(id: string): Observable<OrganizationUnitDto> {
    return this.http.get<OrganizationUnitDto>(`${this.apiUrl}/${id}`);
  }

  create(orgUnit: any): Observable<OrganizationUnitDto> {
    return this.http.post<OrganizationUnitDto>(this.apiUrl, orgUnit);
  }

  update(id: string, orgUnit: any): Observable<OrganizationUnitDto> {
    return this.http.put<OrganizationUnitDto>(`${this.apiUrl}/${id}`, orgUnit);
  }
}
