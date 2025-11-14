import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, of, tap, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IUser } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  public userChanges$ = new BehaviorSubject<IUser | null>(this.auth.getUser() ?? null);

  public getUserInfoSignal(): void {
    const cached = this.auth.getUser();
    if (cached) {
      this.userChanges$.next(cached);

      this.http.get<any>('users/me').pipe(
        tap(u => {
          const real = u?.data ?? u;
          if (real) {
            this.auth.setUser(real);
            this.userChanges$.next(real);
          }
        })
      ).subscribe({
        next: () => {},
        error: () => of(null) 
      });

      return;
    }

    this.http.get<any>('users/me').pipe(
      tap(u => {
        const real = u?.data ?? u;
        if (real) {
          this.auth.setUser(real);
          this.userChanges$.next(real);
        }
      })
    ).subscribe({
      next: () => {},
      error: () => of(null)
    });
  }

  public updateUser(payload: Partial<IUser>) {

    return this.http.put<any>('users/me', payload).pipe(
      map(resp => resp?.data ?? resp),
      tap((updatedUser: IUser) => {
        this.auth.setUser(updatedUser);
        this.userChanges$.next(updatedUser);
      })
    );
  }
}