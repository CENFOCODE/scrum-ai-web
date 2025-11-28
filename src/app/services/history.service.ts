import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IHistory } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class HistoryService {

  private baseURL = 'history/';

  constructor(private http: HttpClient) {}

  getAllHistory() {
    return this.http.get<IHistory[]>(`${this.baseURL}all`);
  }

  getByUser(userId: number) {
    return this.http.get<IHistory[]>(`${this.baseURL}user/${userId}`);
  }
}

