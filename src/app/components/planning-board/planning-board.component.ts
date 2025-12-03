import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  PlanningPokerService,
  IPlanningTicket
} from '../../services/planning-poker.service';

@Component({
  selector: 'app-planning-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planning-board.component.html',
  styleUrl: './planning-board.component.scss'
})
export class PlanningBoardComponent {
  constructor(private planningService: PlanningPokerService) {}

  searchTerm = signal<string>('');

  newTicket: { code: string; module: string; name: string; description: string } = {
    code: '',
    module: '',
    name: '',
    description: ''
  };

  showAddForm = false;

  get participants() {
    return this.planningService.participants$();
  }

  get tickets() {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.planningService.tickets$();
    if (!term) {
      return all;
    }

    return all.filter((t: IPlanningTicket) =>
      t.name.toLowerCase().includes(term) ||
      t.code.toLowerCase().includes(term)
    );
  }

  get selectedTicket() {
    return this.planningService.selectedTicket$();
  }

  get selectedCard() {
    return this.planningService.selectedCard$();
  }

  get cards() {
    return this.planningService.cardsValues;
  }

  handleSearch(term: string) {
    this.searchTerm.set(term);
  }

  handleSelectTicket(ticket: IPlanningTicket) {
    this.planningService.selectTicket(ticket.id);
  }

  handleSelectCard(card: string) {
    this.planningService.selectCard(card);
  }

  handleStartVoting(ticket: IPlanningTicket) {
    this.planningService.selectTicket(ticket.id);
    this.planningService.startVoting(ticket.id);
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
  }

  handleCancelNewTicket() {
    this.newTicket = {
      code: '',
      module: '',
      name: '',
      description: ''
    };
    this.showAddForm = false;
  }

  handleAddTicket() {
    const trimmedName = this.newTicket.name.trim();
    if (!trimmedName) {
      return;
    }

    this.planningService.addTicket({
      code: this.newTicket.code.trim(),
      module: this.newTicket.module.trim(),
      name: trimmedName,
      description: this.newTicket.description.trim()
    });

    this.handleCancelNewTicket();
  }

  // eliminar ticket
  handleDeleteTicket(ticket: IPlanningTicket, event: MouseEvent) {
    event.stopPropagation();
    this.planningService.deleteTicket(ticket.id);
  }
}
