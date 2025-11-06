import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

type CeremonyKey = 'daily' | 'sprint-planning' | 'review' | 'retrospective';

interface Ceremony {
  key: CeremonyKey;
  name: string;
  short: string;
  objectives: string;
  scenario: string;
  participants: string[];
}

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule,
MatSelectModule,],
  templateUrl: './create-session.component.html',
  styleUrls: ['./create-session.component.scss']
})
export class CreateSessionComponent {
  ceremonies: Ceremony[] = [
    {
      key: 'daily',
      name: 'Daily',
      short: 'Revisión rápida de progreso y bloqueos.',
      objectives:
        'Lorem ipsum dolor sit amet consectetur adipiscing elit proin, et porttitor placerat vitae class sed curae vestibulum, morbi dapibus rutrum nisi potenti id quis. Sapien porta vestibulum vitae egestas cursus lacinia habitant aptent, volutpat risus taciti curabitur phasellus lacus nunc purus vehicula.',
      scenario:
        'Lorem ipsum dolor sit amet consectetur adipiscing elit proin, et porttitor placerat vitae class sed curae vestibulum, morbi dapibus rutrum nisi potenti id quis. Sapien porta vestibulum vitae egestas cursus lacinia habitant aptent, volutpat risus taciti curabitur phasellus lacus nunc purus vehicula, mus ridiculus eget tempus congue ad magnis. Scelerisque quisque viverra at nisl hac ligula elementum iaculis ridiculus, vel non blandit curae nisi duis magna senectus.',
      participants: [
        'Lorem ipsum dolor  Rol',
        'Lorem ipsum dolor  Rol',
        'Lorem ipsum dolor  Rol',
        'Lorem ipsum dolor  Rol',
      ],
    },
    {
      key: 'sprint-planning',
      name: 'Sprint planning',
      short: 'Planificación del sprint.',
      objectives: 'Objetivos del planning (contenido simulado).',
      scenario: 'Escenario del planning (contenido simulado).',
      participants: ['Usuario A', 'Usuario B', 'Usuario C'],
    },
    {
      key: 'review',
      name: 'Sprint review',
      short: 'Demostración del incremento.',
      objectives: 'Objetivos de la review (contenido simulado).',
      scenario: 'Escenario de la review (contenido simulado).',
      participants: ['Usuario A', 'Usuario B'],
    },
    {
      key: 'retrospective',
      name: 'Retrospective',
      short: 'Inspección y mejoras.',
      objectives: 'Objetivos de la retro (contenido simulado).',
      scenario: 'Escenario de la retro (contenido simulado).',
      participants: ['Usuario A', 'Usuario B', 'Usuario C', 'Usuario D'],
    },
  ];

  history: string[] = ['Daily', 'Sprint planning'];
  paused: string[] = ['Sprint planning', 'Daily', 'Retrospective'];

  selected = signal<Ceremony>(this.ceremonies[0]);

  difficulty = signal<string>(''); 
  role = signal<string>('');

  pick(key: CeremonyKey) {
    const found = this.ceremonies.find(c => c.key === key);
    if (found) this.selected.set(found);
  }

  start() {
    console.log('Start session', {
      ceremony: this.selected().name,
      difficulty: this.difficulty(),
      role: this.role(),
    });
  }
}
