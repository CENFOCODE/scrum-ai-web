import { Component, ViewEncapsulation, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RoleService, IRole } from '../../services/role.service';
import { AlertService } from '../../services/alert.service';

type CeremonyKey = 'daily' | 'sprint-planning' | 'review' | 'retrospective';
interface Ceremony {
  key: CeremonyKey;
  name: string;
  short: string;
  objectives: string;
  scenario: string;
  participants: string[];
}

const defaultCeremony: Ceremony = {
  key: 'daily',
  name: 'Cargando Ceremonia...',
  short: 'Esperando respuesta del servidor',
  objectives: 'Esperando datos del servicio para los objetivos...',
  scenario: 'Esperando datos del servicio para el escenario...',
  participants: ['Cargando...'],
};

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './create-session.component.html',
  styleUrls: ['./create-session.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CreateSessionComponent {
  public roleService: RoleService = inject(RoleService);
  private alertService: AlertService = inject(AlertService);

  history: string[] = ['Daily', 'Sprint planning'];
  paused: string[] = ['Sprint planning', 'Daily', 'Retrospective'];

  difficulty = signal<string>('');
  role = signal<number | null>(null);

  roles = computed(() => this.roleService.roles$());

  displayedCeremony = computed<Ceremony>(() => {
    const scr = this.roleService.scrum$();
    if (!scr) return defaultCeremony;
    return {
      key: 'daily',
      name: scr.ceremony || defaultCeremony.name,
      short: '',
      objectives: scr.objective || defaultCeremony.objectives,
      scenario: scr.scenario || defaultCeremony.scenario,
      participants: scr.participants || defaultCeremony.participants,
    };
  });

  constructor() {
    this.roleService.getScrumData();
  }

  start() {
    if (this.role() == null) {
      this.alertService.displayAlert(
        'error',
        'Atención: Debes seleccionar un rol',
        'center',
        'top',
        ['error-snackbar']
      );
      return;
    }

    this.alertService.displayAlert(
      'success',
      'Rol registrado correctamente',
      'center',
      'top',
      ['success-snackbar']
    );

    console.log('Start session', {
      ceremony: this.displayedCeremony().name,
      difficulty: this.difficulty(),
      roleId: this.role(),
    });
  }
}
