import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AssetDocumentDto } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/assetdocuments`;

  uploadDocument(assetId: string, file: File, documentType: string): Observable<AssetDocumentDto> {
    const formData = new FormData();
    formData.append('assetId', assetId);
    formData.append('documentType', documentType);
    formData.append('file', file);

    return this.http.post<AssetDocumentDto>(`${this.apiUrl}/upload`, formData);
  }

  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
