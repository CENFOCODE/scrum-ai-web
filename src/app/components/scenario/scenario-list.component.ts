import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";
import { IScenario } from "../../interfaces";

@Component({
  selector: 'app-scenario-list',
  standalone: true,
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss']
})
export class ScenarioListComponent {
  @Input() scenarioList: IScenario[] = [];
  selectedScenario: IScenario | null = null;

  constructor(private router: Router) {}

  selectScenario(scenario: IScenario) {
    this.selectedScenario = scenario;
  }

  confirmSelection() {
    if (this.selectedScenario) {
     
      this.router.navigate(['/app/create-session'], { 
        queryParams: {
          scenarioId: this.selectedScenario.id
        },
        state: { 
          selectedScenario: this.selectedScenario 
        } 
      });
    }
  }
}