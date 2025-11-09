import { Component, Input } from "@angular/core";
import { IScenario } from "../../interfaces";

@Component({
  selector: 'app-scenario-list',
  standalone: true,
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss']
})
export class ScenarioListComponent {
  @Input() scenarioList: IScenario[] = [];
}