import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IHistory } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class HistoryService {

  private baseURL = 'history/';

  constructor(private http: HttpClient) {}

   getHistory(): Observable<any[]> {
    return this.http.get<any>(`${this.baseURL}/all`).pipe(
      map(res => res.data ?? res) // si es GlobalResponseHandler → retorna res.data
    );
  }

  /** Obtiene HxU */
  getHistoryByUser(userId: number): Observable<any[]> {
    return this.http.get<any>(`${this.baseURL}/${userId}`).pipe(
      map(res => res.data ?? res)
    );
  }

  /** Filtro por ceremonia */
  getFilteredHistory(userId: number, ceremony: string): Observable<any[]> {
    return this.http.get<any>(`${this.baseURL}/${userId}/filter?ceremonyType=${ceremony}`).pipe(
      map(res => res.data ?? res)
    );
  }
}

