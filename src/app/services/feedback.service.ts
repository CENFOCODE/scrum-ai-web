import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISimulationFeedback } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  private baseUrl = '';

  constructor(private http: HttpClient) {}

  getFeedbackBySimulation(simulationId: number): Observable<ISimulationFeedback> {
    return this.http.get<ISimulationFeedback>(`${this.baseUrl}feedback/${simulationId}`);
  }
}
