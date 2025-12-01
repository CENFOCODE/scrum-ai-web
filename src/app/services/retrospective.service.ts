import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISimulations } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class RetrospectiveService {

  private retrospectiveURL = 'retrospective/'; 
  private simulationURL = 'simulation/';

  constructor(private http: HttpClient) {}

  saveRetrospective(payload: any) {
    return this.http.post<any>(`${this.retrospectiveURL}save`, payload);
  }

  getBySimulation(simulationId: number) {
    return this.http.get(`${this.retrospectiveURL}${simulationId}`);
  }

  completeSimulation(simulationId: number) {
    return this.http.put(`${this.simulationURL}${simulationId}/complete`, {});
  }
}
