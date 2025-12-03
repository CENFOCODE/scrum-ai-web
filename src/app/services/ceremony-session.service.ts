import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base-service';

@Injectable({
  providedIn: 'root'
})
export class CeremonySessionService extends BaseService<any> {

  constructor() {
    super();
    this.source = 'api/ceremony-session';
  }

  createCeremonySession(data: {
    ceremonyType: string;
    simulationId: number;
    startTime: Date;
  }): Observable<any> {
    return this.http.post(`${this.source}/create`, data);
  }
}