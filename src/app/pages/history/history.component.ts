import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../../services/history.service';
import { ISimulations, IHistory, ISimulationUser } from '../../interfaces';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  simulations: ISimulations[] = [];
  filteredSimulations: ISimulations[] = [];
  simulationUser: ISimulationUser | null = null;

  selectedFilter: string = 'all';

  filters = [
    { key: 'daily', label: 'Daily' },
    { key: 'review', label: 'Review' },
    { key: 'retrospective', label: 'Retrospective' },
    { key: 'planning', label: 'Planning' }
  ];

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory() {
  this.historyService.getHistory().subscribe({
    next: (res: IHistory[]) => {

      if (!Array.isArray(res)) {
        console.error("Formato inesperado en history:", res);
        this.simulations = [];
        this.filteredSimulations = [];
        return;
      }

      this.simulations = res
        .filter(h => h.simulation)
        .map((h: IHistory) => {
          const sim = h.simulation as ISimulations;

                if (h.simulationUser) {

            (sim as any).simulationUsers = [h.simulationUser];
            } else {

            (sim as any).simulationUsers = [];
            }

          return sim;
        });

      this.filteredSimulations = [...this.simulations];
    },
    error: (err) => console.error(err)
  });
}

filterBy(type: string) {
  this.selectedFilter = type;

  if (type === 'all') {
    this.filteredSimulations = [...this.simulations];
    return;
  }

  this.filteredSimulations = this.simulations.filter(
    s => s.scenario?.ceremonyType?.toLowerCase() === type
  );
}


}
