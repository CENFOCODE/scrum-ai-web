import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../../services/history.service';
import { ISimulations, IHistory } from '../../interfaces';

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

      // Extraer la simulación de cada history
      this.simulations = res
        .filter(h => h.simulation)                   // Validar que exista simulation
        .map((h: IHistory) => h.simulation as ISimulations);

      // Copia para el filtrado
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
