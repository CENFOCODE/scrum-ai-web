import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

// Servicios
import { SimulationService } from '../../../services/simulation.service';
import { AuthService } from '../../../services/auth.service';

// Interfaces
import { IScenario, IScenarioTemplate, ISimulations, ISimulationUser } from '../../../interfaces';

// RxJS operator
import { switchMap } from 'rxjs/operators';

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

  notice = signal<Notice | null>(null);
  selectedScenario: IScenario | null = null;

  difficultyLevels = ['Baja', 'Media', 'Alta'];
  scrumRoles = ['Scrum Master', 'Developer', 'Product Owner', 'QA'];

  selectedDifficulty = '';
  selectedRole = '';

  simulation: ISimulations = {};
  simulationUser: ISimulationUser = {};

  isLoading = false;

  constructor(
    private simulationService: SimulationService,
    public authService: AuthService,
    private router: Router
  ) {

    // Sincroniza el escenario seleccionado globalmente
    effect(() => {
      const ceremonyData = this.simulationService.selectedScenario$();
      if (ceremonyData) this.selectedScenario = ceremonyData;
    });

    // Si viene data por navegación
    const nav = this.router.getCurrentNavigation();
    this.ceremonyData = nav?.extras?.state?.['scenario'];
  }
  closeNotice() {
  this.notice.set(null);
}

isArray(value: any): value is string[] {
  return Array.isArray(value);
}


  // ---------------------------
  // GENERA TAREAS A PARTIR DEL PROMPT
  // ---------------------------
  private generateTasksFromPrompt(prompt: string): { title: string, description?: string }[] {
    if (!prompt) return [];

    const sentences = prompt
      .split(/[\.\n]/) // dividir por punto o por salto de línea
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return sentences.map(s => ({
      title: s,
      description: ""
    }));
  }

  // Convertir dificultad a número para el seeder
  private mapDifficultyToNumber(diff: string): number {
    const map: any = { 'Baja': 1, 'Media': 2, 'Alta': 3 };
    return map[diff] || 1;
  }

  // Convertir rol a índice igual que el seeder
  private mapRoleToIndex(role: string): number {
    const map: any = {
      'Scrum Master': 1,
      'Developer': 2,
      'Product Owner': 3,
      'QA': 4
    };
    return map[role] || 1;
  }

  // ⭐ 1. Determina difficulty y role → stepOrder del template
private getStepOrder(): number {
  const mapDifficulty: any = { 'Baja': 1, 'Media': 2, 'Alta': 3 };
  const mapRole: any = {
    'Scrum Master': 1,
    'Developer': 2,
    'Product Owner': 3,
    'QA': 4
  };

  const diffNumber = mapDifficulty[this.selectedDifficulty];
  const roleIndex = mapRole[this.selectedRole];

  return diffNumber * 1000 + roleIndex;
}

onDifficultyAndRolSelected () {
  if(this.selectedRole === "" || this.selectedDifficulty === "") {
    return;
  }
  const stepOrder = this.getStepOrder();

  const template = this.selectedScenario?.templates?.find(
    t => t.stepOrder === stepOrder
  );

  if (template?.promptTemplate) {
    console.log(" Objetivo cargado desde template:", template.promptTemplate);

    this.selectedScenario!.goals = template.promptTemplate;
  } else {
    console.warn(" No se encontró template para rol + dificultad");
  }
}

  // ---------------------------
  // CREAR SIMULACIÓN
  // ---------------------------
createSimulation() {
  // VALIDACIONES
  if (!this.selectedDifficulty.trim()) {
    this.notice.set({ type: 'warning', text: 'Selecciona una dificultad' });
    return;
  }

  if (!this.selectedRole.trim()) {
    this.notice.set({ type: 'warning', text: 'Selecciona un rol' });
    return;
  }

  const currentUserId = this.authService.getUserId();
  if (!currentUserId) {
    alert('No se encontró el usuario actual.');
    return;
  }

  const stepOrder = this.getStepOrder();

  // ⭐ 2. BUSCAR TEMPLATE ESPECÍFICO EN EL ESCENARIO
  const template = this.selectedScenario?.templates?.find(
    t => t.stepOrder === stepOrder
  );

  // ⭐ Guardar escenario actualizado global
  this.simulationService.setSelectedScenario(this.selectedScenario!);

  // ⭐ 4. Crear la simulación normalmente
  const now = new Date();
  const newSimulation: ISimulations = {
    difficultyLevel: this.selectedDifficulty,
    startDate: now,
    endDate: new Date(now.getTime() + 60 * 60000),
    createdBy: { id: currentUserId },
    scenario: { id: this.selectedScenario?.id }
  };

  this.simulationService.createSimulation(newSimulation)
    .pipe(
      switchMap((createdSim) => {
        const newSimUser: ISimulationUser = {
          scrumRole: this.selectedRole,
          assignedAt: new Date(),
          simulation: { id: createdSim.id },
          user: { id: currentUserId }
        };
        return this.simulationService.createSimulationUser(newSimUser);
      })
    )
    .subscribe({
      next: (simUser) => {
        this.simulationService.setSelectedUser(simUser);
        this.router.navigate(
          ['/app/' + this.selectedScenario!.name!.toLowerCase()],
          {
            state: {
              scenario: this.selectedScenario,
              simulationUser: simUser,
              aiTemplate: template
            }
          }
        );
      },
      error: () => {
        this.notice.set({
          type: 'error',
          text: 'Error al crear la sesión.'
        });
      }
    });
}

  private redirectToScenarioPage(scenarioName?: string, stateData?: any) {
    const routes: any = {
      'daily': '/app/daily',
      'planning': '/app/planning',
      'review': '/app/review',
      'retrospective': '/app/retrospective'
    };

    const path = routes[scenarioName?.toLowerCase() || ''];
    if (path) {
      this.router.navigate([path], { state: stateData });
    }
  }

}
