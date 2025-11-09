import { Component, ViewEncapsulation, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RoleService } from '../../services/role.service';
import { MatInputModule } from '@angular/material/input';

type CeremonyKey = 'daily' | 'sprint-planning' | 'review' | 'retrospective';
interface Ceremony {
  key: CeremonyKey;
  name: string;
  short: string;
  intro: string;
  objectives: string;
  scenario: string;
  participants: string[];
}

const defaultCeremony: Ceremony = {
  key: 'daily',
  name: 'Cargando Ceremonia...',
  short: 'Esperando respuesta del servidor',
  intro: 'Cargando introducción de la ceremonia...',
  objectives: 'Esperando datos del servicio para los objetivos...',
  scenario: 'Esperando datos del servicio para el escenario...',
  participants: ['Cargando...'],
};

type NoticeType = 'success' | 'warning' | 'error';
interface Notice {
  type: NoticeType;
  text: string;
}

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule],
  templateUrl: './create-session.component.html',
  styleUrls: ['./create-session.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CreateSessionComponent {
  public roleService: RoleService = inject(RoleService);

  history: string[] = ['Daily', 'Sprint planning'];
  paused: string[] = ['Sprint planning', 'Daily', 'Retrospective'];

  difficulty = signal<string>('');
  role = signal<number | null>(null);
  inviteEmail = signal<string>('');

  roles = computed(() => this.roleService.roles$());

  displayedCeremony = computed<Ceremony>(() => {
    const scr = this.roleService.scrum$();
    if (!scr) return defaultCeremony;
    return {
      key: 'daily',
      name: scr.ceremony || defaultCeremony.name,
      intro: scr.intro || 'Sin descripción disponible',
      short: '',
      objectives: scr.objective || defaultCeremony.objectives,
      scenario: scr.scenario || defaultCeremony.scenario,
      participants: scr.participants || defaultCeremony.participants,
    };
  });

  notice = signal<Notice | null>(null);

  constructor() {
    this.roleService.getScrumData();
  }

  onStart() {
    if (this.role() == null) {
      this.notice.set({
        type: 'warning',
        text: 'Atención: Debes seleccionar un rol'
      });
      return;
    }

    this.notice.set({
      type: 'success',
      text: 'Rol registrado correctamente'
    });

    console.log('Start session', {
      ceremony: this.displayedCeremony().name,
      difficulty: this.difficulty(),
      roleId: this.role(),
    });
  }

  closeNotice() {
    this.notice.set(null);
  }
}
