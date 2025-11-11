import { Component, Input, Output, EventEmitter } from "@angular/core";
import { IScenario } from "../../../interfaces";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-scenario-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss']
})
export class ScenarioListComponent {
  selectedScenario: string | null = null;
  @Input() scenarios: IScenario[] = [];
  @Output() ceremonySelected = new EventEmitter<IScenario>();

  selectScenario(ceremonyType: string | undefined) {
    if (ceremonyType) {
      this.selectedScenario = ceremonyType;
    }
  }

  confirmSelection() {
    if (this.selectedScenario) {
      const selectedData = this.scenarios.find(s => s.ceremonyType === this.selectedScenario);
      if (selectedData) {
        this.ceremonySelected.emit(selectedData); // Emitir al padre en lugar de navegar
      }
    }
  }
}