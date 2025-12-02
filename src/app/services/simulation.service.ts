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

completeSimulation(id: number) {
  return this.http.put(`${this.baseUrl}/simulation/${id}/complete`, {});
}

  // -----------------------
// NUEVOS SIGNALS PARA DAILY
// -----------------------
private selectedUserSignal = signal<ISimulationUser | null>(null);

get selectedUser$() {
  return this.selectedUserSignal;
}

private dailyBoardSignal = signal<any | null>(null);
private dailyAnswersSignal = signal<any | null>(null);

// -----------------------
// GETTERS
// -----------------------

get dailyBoard$() {
  return this.dailyBoardSignal;
}

getDailyBoard() {
  return this.dailyBoardSignal();
}


get dailyAnswers$() {
  return this.dailyAnswersSignal;
}

// -----------------------
// SETTERS
// -----------------------
setSelectedUser(user: ISimulationUser) {
  this.selectedUserSignal.set(user);
}

setDailyBoard(board: any) {
  this.dailyBoardSignal.set(board);
}

setDailyAnswers(answers: any) {
  this.dailyAnswersSignal.set(answers);
}

// -----------------------
// RESET DEL DAILY
// -----------------------
clearDaily() {
  this.dailyBoardSignal.set(null);
  this.dailyAnswersSignal.set(null);
}

// -----------------------------------------
// INFO DE CEREMONIA (roles activos + sala + rol del usuario)
// -----------------------------------------
private dailyCeremonyInfoSignal = signal<any | null>(null);

get dailyCeremonyInfo$() {
  return this.dailyCeremonyInfoSignal;
}

setDailyCeremonyInfo(info: any) {
  this.dailyCeremonyInfoSignal.set(info);
}

}
