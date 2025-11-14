import { Injectable, signal } from "@angular/core";
import { ISimulations, IScenario, ISimulationUser } from "../interfaces";
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private selectedScenarioSignal = signal<IScenario | null>(null);

  private baseUrl = '';

  constructor(private http: HttpClient) {}

  // Exponer como observable signal
  get selectedScenario$() {
    return this.selectedScenarioSignal;
  }


  setSelectedScenario(scenario: IScenario) {
    this.selectedScenarioSignal.set(scenario);
  }

  
  createSimulation(simulation: ISimulations): Observable<ISimulations> {
    return this.http.post<ISimulations>(`${this.baseUrl}simulation`, simulation);
  }

  createSimulationUser(simulationUser: ISimulationUser): Observable<ISimulationUser> {
    return this.http.post<ISimulationUser>(`${this.baseUrl}simulationUser`, simulationUser);
  }
}
