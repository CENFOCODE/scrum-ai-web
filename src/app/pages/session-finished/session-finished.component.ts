import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionFinishedService } from '../../services/session-finished.service';
import { SessionFinishedViewComponent } from '../../components/session-finished/session-finished-view.component';

@Component({
  selector: 'app-session-finished',
  standalone: true,
  imports: [CommonModule, RouterModule, SessionFinishedViewComponent],
  templateUrl: './session-finished.component.html',
  styleUrls: ['./session-finished.component.scss']
})
export class SessionFinishedComponent {

  participantes: string[] = [];
  durationOne = '';
  durationTwo = '';

  constructor(private sessionService: SessionFinishedService) {
    const summary = this.sessionService.getSummary();
    this.participantes = summary.participantes;
    this.durationOne = summary.duracion1;
    this.durationTwo = summary.duracion2;
  }

  nextStep() {
    console.log('nextStep');
  }
}
