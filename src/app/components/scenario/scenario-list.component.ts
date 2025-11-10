import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: 'app-scenario-list',
  standalone: true,
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss']
})
export class ScenarioListComponent {
  selectedScenario: string | null = null;

  // Datos estáticos de los scenarios para crear simulaciones
  scenarioData = {
    'Planning': {
      ceremonyType: 'Planning',
      estimatedDuration: 120,
      description: 'Reunión donde se define qué trabajo se realizará en el próximo sprint, se estiman tareas y se asignan responsabilidades.',
      goals: 'Definir el trabajo del próximo sprint, estimar tareas y asignar responsabilidades al equipo de desarrollo.'
    },
    'Daily': {
      ceremonyType: 'Daily',
      estimatedDuration: 15,
      description: 'Reunión diaria para sincronizar al equipo, identificar impedimentos y actualizar el progreso del trabajo.',
      goals: 'Sincronizar al equipo, identificar y resolver impedimentos, y revisar el progreso diario del sprint.'
    },
    'Review': {
      ceremonyType: 'Review',
      estimatedDuration: 60,
      description: 'Reunión de revisión del sprint para presentar los entregables completados al Product Owner y recibir retroalimentación.',
      goals: 'Presentar los entregables del sprint, obtener retroalimentación del Product Owner y validar el trabajo realizado.'
    },
    'Retrospective': {
      ceremonyType: 'Retrospective',
      estimatedDuration: 60,
      description: 'Reunión de retrospectiva para reflexionar sobre el sprint pasado, identificar mejoras y planear acciones correctivas.',
      goals: 'Reflexionar sobre el sprint anterior, identificar áreas de mejora y planificar acciones correctivas para el siguiente sprint.'
    }
  };

  constructor(private router: Router) {}

  selectScenario(scenarioType: string) {
    this.selectedScenario = scenarioType;
  }

  confirmSelection() {
    if (this.selectedScenario) {
      const selectedData = this.scenarioData[this.selectedScenario as keyof typeof this.scenarioData];
      
      
      this.router.navigate(['/app/create-session'], { 
        state: { 
          ceremonyData: selectedData
        } 
      });
    }
  }
}