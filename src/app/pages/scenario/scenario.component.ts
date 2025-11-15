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
  imports: [CommonModule, ScenarioListComponent, CreateSessionComponent],
  templateUrl: './scenario.component.html',
  styleUrls: ['./scenario.component.scss'],
})

export class ScenarioComponent {

    private simulationService = inject(SimulationService);
    public scenarioService: ScenarioService = inject(ScenarioService);
    
    // Estado para controlar qué componente mostrar
    selectedCeremony: IScenario | null = null;
    showCreateSession = false;

    constructor() {
        this.scenarioService.getAll();
        console.log('Escenarios disponibles:', this.scenarioService.scenario$());

        // Efecto para monitorear cambios en los escenarios
        effect(() => {
            const scenarios = this.scenarioService.scenario$();
            console.log('Escenarios actualizados:', scenarios);
        });
    }

    // Manejar la selección de ceremonia desde scenario-list
    onCeremonySelected(ceremony: IScenario) {
        this.selectedCeremony = ceremony;
        this.simulationService.setSelectedScenario(ceremony);
        this.showCreateSession = true;
        console.log('Ceremonia seleccionada:', ceremony);
    }
}