import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionFinishedService {

  constructor() {}

  getSummary() {
    return {
      participantes: [
        'Lorem ipsum dolor Rol',
        'Lorem ipsum dolor Rol',
        'Lorem ipsum dolor Rol',
        'Lorem ipsum dolor Rol'
      ],
      duracion1: 'Lorem ipsum dolor',
      duracion2: 'Lorem ipsum dolor'
    };
  }
}
