import { CommonModule } from "@angular/common";
import { Component, effect, inject } from "@angular/core";
import { ScenarioService } from "../../services/scenario.service";
import { ScenarioListComponent } from "../../components/scenarios/scenario-list/scenario-list.component";
import { CreateSessionComponent } from "../../components/scenarios/create-session/create-session.component";
import { IScenario } from "../../interfaces";
import { SimulationService } from "../../services/simulation.service";

@Component({
  selector: 'app-scenario',
  standalone: true,
  imports: [
    CommonModule,
    ScenarioListComponent,
    CreateSessionComponent
  ],
  templateUrl: './scenario.component.html',
  styleUrls: ['./scenario.component.scss'],
})
export class ScenarioComponent {

  // Servicios inyectados
  private simulationService = inject(SimulationService);
  public scenarioService: ScenarioService = inject(ScenarioService);

  // Estado de UI
  selectedCeremony: IScenario | null = null;
  showCreateSession = false;

  constructor() {

    // 1) Cargar escenarios desde el backend
    this.scenarioService.getAll();

    // 2) Escuchar cuando un escenario sea seleccionado desde scenario-list
    effect(() => {
      const scenarios = this.scenarioService.scenario$();
      // no hacemos nada, solo reaccionamos para mantenerlo vivo
    });

    // 3) 🔥 Escuchar los cambios DINÁMICOS hechos por CreateSession
    //    (goals, backlog, etc.) 
    effect(() => {
      const updatedScenario = this.simulationService.selectedScenario$();

      if (updatedScenario) {
        this.selectedCeremony = updatedScenario;   // ← refresca la UI automáticamente
      }
    });
  }

  /**
   * Ejecutado cuando el usuario selecciona un escenario desde ScenarioList
   */
  onCeremonySelected(ceremony: IScenario) {
    this.selectedCeremony = ceremony;
    this.showCreateSession = true;

    // Guardar en estado global
    this.simulationService.setSelectedScenario(ceremony);
  }

}
