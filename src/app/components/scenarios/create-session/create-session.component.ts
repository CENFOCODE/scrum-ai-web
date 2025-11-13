import { Component, Input, Output, EventEmitter, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SimulationService } from '../../../services/simulation.service';
import { IScenario, ISimulations, ISimulationUser } from '../../../interfaces';
import { AuthService } from '../../../services/auth.service';
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

  selectedScenario: IScenario | null = null

  difficultyLevels = ['Baja', 'Media', 'Alta'];
  scrumRoles  = ['Scrum Master', 'Developer', 'Product Owner', 'QA'];

  selectedDifficulty = '';
  selectedRole = '';
  scenario?: IScenario;
  simulation: ISimulations = {};
  simulationUser: ISimulationUser = {};

 constructor(
    private simulationService: SimulationService,
    public authService: AuthService,
    private router: Router,
  ) {
  effect(() => {
      const ceremonyData = this.simulationService.selectedScenario$();
      if (ceremonyData) {
        this.selectedScenario = ceremonyData;
        console.log('Escenario recibido en CreateSession:', ceremonyData);
      }
    });
    const nav = this.router.getCurrentNavigation();
    this.ceremonyData = nav?.extras?.state?.['scenario'];
  }


  isLoading = false;

  

  closeNotice() {
    this.notice.set(null);
  }

  
  createSimulation() {
    if (!this.selectedDifficulty|| !this.selectedRole) {
      this.notice.set({
        type: 'warning',
        text: 'Atención: Debes seleccionar un rol'
      });
    }

    if (this.selectedDifficulty.trim() === '') {
    this.notice.set({
        type: 'warning',
        text: 'Atención: Debes seleccionar una dificultad'
      });
    return;
  }

  if (this.selectedRole.trim() === '') {
    this.notice.set({
        type: 'warning',
        text: 'Atención: Debes seleccionar un rol'
      });
    return;
  }

    
    const currentUserId = this.authService.getUserId();
    if (!currentUserId) {
      alert('Error: no se encontró el usuario actual.');
      return;
    }

    


 this.isLoading = true;
  const now = new Date();
  const newSimulation: ISimulations = {
    difficultyLevel: this.selectedDifficulty,
    startDate: now,
    endDate: new Date(now.getTime() + 60 * 60000),
    createdBy: { 
		"id" : 1,
		"role": {
					"id": 3,
					"name": "SUPER_ADMIN",
					"description": "Super Administrator role",
					"createdAt": "2025-11-12T00:52:44.021+00:00",
					"updatedAt": "2025-11-12T00:52:44.021+00:00"
				}
							 },
    scenario: { id: this.selectedScenario?.id}
  };

   this.simulationService.createSimulation(newSimulation).pipe(
    switchMap((createdSim) => {
      console.log('Simulation guardada en DB con id:', createdSim.id);

      if (!createdSim.id) {
      alert('Error: el backend no devolvió el id de la Simulation.');
      throw new Error('Simulation sin id');
    }

      const newSimUser: ISimulationUser = {
        scrumRole: this.selectedRole,
        assignedAt: new Date(),
        simulation: { id: createdSim.id } 
      };


      return this.simulationService.createSimulationUser(newSimUser);
    })
  ).subscribe({
    next: (res) => {
      console.log('SimulationUser creado:', res);
      this.notice.set({
      type: 'success',
      text: 'Ceremonia configurada correctamente'
    });
      this.isLoading = false;
      this.sessionCreated.emit(res);
    },
    error: (err) => {
      console.error('Error en el flujo', err);
      this.isLoading = false;
    }
  });
}
}

