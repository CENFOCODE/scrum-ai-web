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
import { IScenario, IScenarioTemplate, ISimulations, ISimulationUser } from '../../../interfaces';
import { AuthService } from '../../../services/auth.service';
import { switchMap, map } from 'rxjs/operators';
import { ScenarioTemplateService } from '../../../services/scenario-template.service';

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
  scenarioTemplate: IScenarioTemplate = {};

 constructor(
    private simulationService: SimulationService,
    public authService: AuthService,
    private router: Router,
    private scenarioTemplateService: ScenarioTemplateService
   
  ) {
  effect(() => {
      const ceremonyData = this.simulationService.selectedScenario$();
      if (ceremonyData) {
        this.selectedScenario = ceremonyData;
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
  const userId = this.authService.getUser().id;
  const now = new Date();
  const newSimulation: ISimulations = {
    difficultyLevel: this.selectedDifficulty,
    startDate: now,
    endDate: new Date(now.getTime() + 60 * 60000),
    createdBy: { id : userId },
    scenario: { id: this.selectedScenario?.id}
  };

  
  this.scenarioTemplateService.getTemplate(
    this.selectedScenario?.id || 0,
    this.scenarioTemplateService.mapDifficultyToNumber(this.selectedDifficulty),
    this.selectedRole
  ).pipe(
    switchMap((templateResponse: any) => {
    
      if (templateResponse && templateResponse.promptTemplate) {
        this.scenarioTemplate = templateResponse;
      } 

      else if (templateResponse && templateResponse.data) {
        if (Array.isArray(templateResponse.data) && templateResponse.data.length > 0) {
          this.scenarioTemplate = templateResponse.data[0];
        } else if (templateResponse.data.promptTemplate) {
          this.scenarioTemplate = templateResponse.data;
        }
      } else {
        this.scenarioTemplate = {}; 
      }
      
     
      return this.simulationService.createSimulation(newSimulation);
    }),
    switchMap((createdSim) => {
      if (!createdSim.id) {
      alert('Error: el backend no devolvió el id de la Simulation.');
      throw new Error('Simulation sin id');
    }

    this.simulation = createdSim;


      const newSimUser: ISimulationUser = {
        scrumRole: this.selectedRole,
        assignedAt: new Date(),
        simulation: { id: createdSim.id },
        user: { id: currentUserId }
      };

      
      return this.simulationService.createSimulationUser(newSimUser);
    })
  ).subscribe({
    next: (res) => {
      this.isLoading = false;
      this.redirectToScenarioPage(this.selectedScenario?.name, {
        scenario: this.selectedScenario,
        simulationUser: res
      });
      this.sessionCreated.emit(res);
    },
    error: (err) => {
      console.error('Error en el flujo', err);
      this.isLoading = false;
      
      // Manejar el error 404 de plantilla no encontrada
      if (err.status === 404) {
        this.notice.set({
          type: 'warning',
          text: `No se encontró una plantilla para ${this.selectedScenario?.name} con dificultad ${this.selectedDifficulty} y rol ${this.selectedRole}. Continuando sin plantilla específica.`
        });
        
        // Redirigir al dashboard sin plantilla
        this.scenarioTemplate = {};
        this.redirectToDashboard();
      } else {
        this.notice.set({
          type: 'error',
          text: 'Error al crear la sesión. Por favor, intenta nuevamente.'
        });
      }
    }
  });
}
      private redirectToScenarioPage(scenarioName?: string, stateData?: any) {
      if (!scenarioName) {
        alert('Error: el escenario no tiene nombre definido.');
        return;
      }

       const normalizedName = scenarioName.trim().toLowerCase();

       const routes: Record<string, string> = {
    'daily': '/app/daily',
    'planning': '/app/planning',
    'review': '/app/review',
    'retrospective': '/app/retrospective'
  };

  const routePath = routes[normalizedName];

  if (routePath) {
    console.log(`➡️ Redirigiendo a: ${routePath}`);
    this.router.navigate([routePath], { 
      state: {
        ...(stateData || {}),
        simulation: this.simulation,    
        simulationId: this.simulation?.id,
        scenario: this.selectedScenario,
        simulationUser: this.simulationUser,
        aiTemplate: this.scenarioTemplate
      }
    });
  } else {
    this.notice.set({
      type: 'error',
      text: `Error: No se encontró una ruta para el escenario "${scenarioName}".`
    });
    this.isLoading = false;
    return;
  }

}

private redirectToDashboard() {
   
    this.router.navigate(['/app/dashboard'], { 
      state: {
        scenario: this.selectedScenario,
        simulationUser: this.simulationUser,
        aiTemplate: this.scenarioTemplate 
      }
    }); 
    
 
    console.log('Datos enviados al dashboard:', {
      scenario: this.selectedScenario,
      simulationUser: this.simulationUser,
      aiTemplate: this.scenarioTemplate 
    });
}
}