import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISimulations } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class RetrospectiveService {

  private baseURL = 'retrospective/'; 

  constructor(private http: HttpClient) {}

  saveRetrospective(payload: any) {
    return this.http.post(`${this.baseURL}save`, payload);
  }

  getBySimulation(simulationId: ISimulations) {
    return this.http.get(`${this.baseURL}${simulationId}`);
  }
}
