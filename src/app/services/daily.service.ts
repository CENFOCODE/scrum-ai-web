import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DailyService {

  private dailyURL = 'api/daily/';
  private simulationURL = 'simulation/';

  constructor(private http: HttpClient) {}

  /**
   * Guarda el Daily + genera feedback IA (similar a saveRetrospective)
   */
  saveDaily(payload: any) {
    return this.http.post<any>(`${this.dailyURL}save`, payload);
  }

  /**
   * Obtiene el Daily guardado (similar al getBySimulation de retrospective)
   */
  getBySimulation(simulationId: number) {
    return this.http.get(`${this.dailyURL}${simulationId}`);
  }

  /**
   * Marca la simulación como completada (igual que Retrospective)
   */
  completeSimulation(simulationId: number) {
    return this.http.put(`${this.simulationURL}${simulationId}/complete`, {});
  }
}
