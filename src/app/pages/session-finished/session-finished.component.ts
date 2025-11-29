import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-session-finished',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-finished.component.html',
  styleUrls: ['./session-finished.component.scss']
})
export class SessionFinishedComponent {

  participantes = [
    'Lorem ipsum dolor  Rol',
    'Lorem ipsum dolor  Rol',
    'Lorem ipsum dolor  Rol',
    'Lorem ipsum dolor  Rol'
  ];

  durationOne = 'Lorem ipsum dolor';
  durationTwo = 'Lorem ipsum dolor';

  nextStep() {
    console.log('nextStep');
  }
}
