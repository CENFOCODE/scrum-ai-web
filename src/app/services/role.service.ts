import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IResponse } from '../interfaces'; 

export interface IRole {
  id: number;
  name: string;
  description?: string;
  maxAllowed?: number;
  occupied?: number;
}

export interface IScrumData {
  ceremony: string;
  intro: string;
  objective: string;
  scenario: string;
  participants: string[];
  roles: IRole[];
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);

  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _roles = signal<IRole[]>([]);
  private _scrum = signal<IScrumData | null>(null);

  loading$ = () => this._loading();
  error$ = () => this._error();
  roles$ = () => this._roles();
  scrum$ = () => this._scrum();


  private base = 'scrum-roles';

  getScrumData(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<IResponse<IScrumData>>(`${this.base}/scrum-data`)
      .subscribe({
        next: (res) => {
          const data = res.data;
          this._scrum.set(data ?? null);
          this._roles.set(data?.roles ?? []);
          this._loading.set(false);
        },
        error: (err) => {
          console.error('roles.getScrumData error', err);
          this._error.set('No se pudo cargar la información de la ceremonia');
          this._loading.set(false);
        }
      });
  }

  assignRole(payload: { roleId: number; userId: number; simulationId?: number }): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.post<IResponse<unknown>>(`${this.base}/assign`, payload)
      .subscribe({
        next: () => {
          this.getScrumData();
        },
        error: (err) => {
          console.error('roles.assignRole error', err);
          this._error.set('No se pudo asignar el rol');
          this._loading.set(false);
        }
      });
  }
}
