import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoleService } from '../../../services/role.service';
import { IScenario } from '../../../interfaces';

type NoticeType = 'success' | 'warning' | 'error';
interface Notice {
  type: NoticeType;
  text: string;
}

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './create-session.component.html',
  styleUrls: ['./create-session.component.scss']
})
export class CreateSessionComponent {
  @Input() ceremonyData!: IScenario;
  @Output() backToSelection = new EventEmitter<void>();
  @Output() sessionCreated = new EventEmitter<any>();

  public roleService = inject(RoleService);

  role = signal<number | null>(null);
  difficulty = signal<string>('medium');
  inviteEmail = signal<string>('');
  notice = signal<Notice | null>(null);

  // Computed para obtener datos del servicio
  scrumData = computed(() => {
    const data = this.roleService.scrum$();
    return data || {
      ceremony: this.ceremonyData?.ceremonyType || 'Ceremonia',
      intro: this.ceremonyData?.description || 'Sin descripción disponible',
      objective: this.ceremonyData?.goals || 'Objetivos no definidos',
      scenario: this.ceremonyData?.backlog || 'Escenario no disponible',
      participants: ['Product Owner', 'Scrum Master', 'Development Team']
    };
  });

  constructor() {
    this.roleService.getScrumData();
  }

  goBack() {
    this.backToSelection.emit();
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

    const sessionData = {
      ceremonyType: this.ceremonyData?.ceremonyType,
      description: this.ceremonyData?.description,
      estimatedDuration: this.ceremonyData?.estimatedDuration,
      difficulty: this.difficulty(),
      roleId: this.role(),
      inviteEmail: this.inviteEmail()
    };

    console.log('Crear nueva simulación:', sessionData);
    this.sessionCreated.emit(sessionData);
  }

  closeNotice() {
    this.notice.set(null);
  }
}