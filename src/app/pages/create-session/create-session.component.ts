import { Component, ViewEncapsulation, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
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
  private router: Router = inject(Router);

  // Datos de la ceremonia seleccionada para crear simulación
  ceremonyData: any = null;

  history: string[] = ['Daily', 'Sprint planning'];
  paused: string[] = ['Sprint planning', 'Daily', 'Retrospective'];

  difficulty = signal<string>('');
  role = signal<number | null>(null);
  inviteEmail = signal<string>('');

  roles = computed(() => this.roleService.roles$());

  displayedCeremony = computed<Ceremony>(() => {
    // Si hay datos de ceremonia seleccionada, usar esos datos
    if (this.ceremonyData) {
      return {
        key: 'daily',
        name: this.ceremonyData.ceremonyType || 'Ceremonia Seleccionada',
        intro: this.ceremonyData.ceremonyType || 'Ceremonia seleccionada para simulación',
        short: '',
        objectives: this.ceremonyData.goals || 'Sin objetivos definidos',
        scenario: this.ceremonyData.description || 'Sin descripción disponible',
        participants: ['Scrum Master', 'Product Owner', 'Development Team'],
      };
    }

    // Fallback al comportamiento original
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
    // Obtener los datos de la ceremonia seleccionada para crear simulación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.ceremonyData = navigation.extras.state['ceremonyData'];
      console.log('Datos de ceremonia recibidos:', this.ceremonyData);
    }
    
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
      text: 'Ceremonia configurada correctamente'
    });

    console.log('Crear nueva simulación:', {
      ceremonyType: this.ceremonyData?.ceremonyType,
      description: this.ceremonyData?.description,
      estimatedDuration: this.ceremonyData?.estimatedDuration,
      difficulty: this.difficulty(),
      roleId: this.role(),
      inviteEmail: this.inviteEmail()
    });
  }

  closeNotice() {
    this.notice.set(null);
  }
}
