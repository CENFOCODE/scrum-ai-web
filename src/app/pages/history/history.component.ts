import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../../services/history.service';
import { ISimulations } from '../../interfaces';

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
    this.historyService.getAllHistory().subscribe({
      next: (res: any[]) => {
        // history tiene simulation → scenario → ceremonyType
        this.simulations = res.map(h => h.simulation);
        this.filteredSimulations = [...this.simulations];
      },
      error: (err) => {
        console.error('Error cargando historial:', err);
      }
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
