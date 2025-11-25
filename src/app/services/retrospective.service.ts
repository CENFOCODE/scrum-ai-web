import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RetrospectiveService {

  private baseURL = ''; 

  constructor(private http: HttpClient) {}

  saveRetrospective(payload: any): Observable<any> {
    return this.http.post(this.baseURL, payload);
  }
}
