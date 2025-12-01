import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ISimulations } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionFinishedService {

  private api = environment.apiUrl;  

  constructor(private http: HttpClient) {}

  getLastSimulation(): Observable<ISimulations | null> {

    return this.http.get<ISimulations[]>(`${this.api}simulation`).pipe(
      map((list: ISimulations[]) => {
        if (!Array.isArray(list) || list.length === 0) {
          return null;
        }

        return list[list.length - 1];
      })
    );
  }
}
