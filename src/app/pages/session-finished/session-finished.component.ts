import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { SessionFinishedService } from '../../services/session-finished.service';

import { SessionFinishedViewComponent } from '../../components/session-finished/session-finished-view.component';

import { ISimulations } from '../../interfaces';

@Component({
  selector: 'app-session-finished',
  standalone: true,
  imports: [CommonModule, SessionFinishedViewComponent],
  templateUrl: './session-finished.component.html',
  styleUrls: ['./session-finished.component.scss'],
})
export class SessionFinishedComponent implements OnInit {

  scoreFinal: number = 87;
  participantes: string[] = ['Invitado 1', 'Invitado 2', 'Invitado 3', 'Invitado 4', 'Invitado 5'];
  durationFinal: string = '28:34 minutos';

  userName: string = '';
  userRole: string = '';
  ceremonyName: string = '';
  dificultad: string = '';

  constructor(
    private sessionFinishedService: SessionFinishedService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSession();
  }

  loadSession(): void {
  this.sessionFinishedService.getLastSimulation().subscribe({
    next: (sim: any) => {

      if (!sim) return;

      console.log("SIM RAW:", sim);

      const user = this.authService.getUser();
      this.userName = user?.name || sim.userName || 'Usuario';

      // Ceremonia
      this.ceremonyName = sim.ceremonyType || sim.ceremony || 'N/A';

      // Dificultad
      this.dificultad = sim.difficulty || sim.difficultyLevel || 'N/A';

      // Rol
      this.userRole = sim.scrumRole || 'N/A';
    },

    error: (err) => console.error(err)
  });
}
nextStep() {
  this.router.navigate(['/app/scenario']);
}
}
