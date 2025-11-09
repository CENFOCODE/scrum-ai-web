import { CommonModule } from "@angular/common";
import { Component, effect, inject } from "@angular/core";
import { ScenarioService } from "../../services/scenario.service";
import { ScenarioListComponent } from "../../components/scenario/scenario-list.component";

@Component({
  selector: 'app-scenario',
  standalone: true,
  imports: [CommonModule, ScenarioListComponent],
  templateUrl: './scenario.component.html',
  styleUrls: ['./scenario.component.scss'],
})

export class ScenarioComponent {
    
    public scenarioService: ScenarioService = inject(ScenarioService);

    constructor() {
        this.scenarioService.getAll();
        
    }
}
