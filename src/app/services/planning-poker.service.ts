import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IResponse } from '../interfaces';
import { AlertService } from './alert.service';

export type PlanningTicketStatus = 'Pendiente' | 'Votando' | 'Listo';

export interface IPlanningTicket {
  id: string;
  code: string;
  name: string;
  description: string;
  module?: string;
  storyPoints?: number;
  status: PlanningTicketStatus;
}

interface IPlanningTicketApi {
  id: number;
  code: string;
  name: string;
  description: string;
  module?: string;
  storyPoints?: number;
  status: PlanningTicketStatus;
}

@Injectable({ providedIn: 'root' })
export class PlanningPokerService {

  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private readonly baseUrl = 'planning-ticket';

  private participantsSignal = signal<string[]>([
    'Scrum Master',
    'Product Owner',
    'Developer 1',
    'Developer 2'
  ]);

  private ticketsSignal = signal<IPlanningTicket[]>([]);
  private selectedTicketSignal = signal<IPlanningTicket | null>(null);
  private selectedCardSignal = signal<string | null>(null);

  private readonly cards: string[] = [
    '0', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?'
  ];

  constructor() {
    this.loadTicketsFromApi();
  }

  private normalizeTicket(apiTicket: IPlanningTicketApi): IPlanningTicket {
    return {
      ...apiTicket,
      id: String(apiTicket.id),
    };
  }

  private loadTicketsFromApi() {
    this.http.get<IResponse<IPlanningTicketApi[]>>(this.baseUrl).subscribe({
      next: (res) => {
        const data = res.data || [];
        const normalized = data.map(t => this.normalizeTicket(t));
        this.ticketsSignal.set(normalized);
        this.selectedTicketSignal.set(normalized[0] ?? null);
      },
      error: () => {
        console.error('Error cargando tickets de planning');
        this.alertService.displayAlert(
          'error',
          'Error cargando los tickets de Planning Poker',
          'center',
          'top',
          ['error-snackbar']
        );
      }
    });
  }

  get participants$() {
    return this.participantsSignal;
  }

  get tickets$() {
    return this.ticketsSignal;
  }

  get selectedTicket$() {
    return this.selectedTicketSignal;
  }

  get selectedCard$() {
    return this.selectedCardSignal;
  }

  get cardsValues() {
    return this.cards;
  }

  selectTicket(ticketId: string) {
    const found = this.ticketsSignal().find(t => t.id === ticketId) ?? null;
    this.selectedTicketSignal.set(found);
    this.selectedCardSignal.set(null);
  }

  addTicket(ticket: { code: string; module?: string; name: string; description: string }) {
    const payload: Partial<IPlanningTicketApi> = {
      code: ticket.code,
      module: ticket.module,
      name: ticket.name,
      description: ticket.description,
      status: 'Pendiente'
    };

    this.http.post<IResponse<IPlanningTicketApi>>(this.baseUrl, payload).subscribe({
      next: (res) => {
        const created = this.normalizeTicket(res.data);
        const current = this.ticketsSignal();
        this.ticketsSignal.set([...current, created]);

        this.alertService.displayAlert(
          'success',
          'Ticket creado correctamente',
          'center',
          'top',
          ['success-snackbar']
        );
      },
      error: () => {
        console.error('Error creando ticket de planning');
        this.alertService.displayAlert(
          'error',
          'Error creando el ticket de Planning Poker',
          'center',
          'top',
          ['error-snackbar']
        );
      }
    });
  }

  selectCard(card: string) {
    this.selectedCardSignal.set(card);

    const ticket = this.selectedTicketSignal();
    if (!ticket) return;

    const storyPoints = parseInt(card, 10);
    if (Number.isNaN(storyPoints)) return;

    const idNumber = Number(ticket.id);
    if (!idNumber) return;

    const payload: IPlanningTicketApi = {
      id: idNumber,
      code: ticket.code,
      name: ticket.name,
      description: ticket.description,
      module: ticket.module,
      storyPoints,
      status: 'Listo'
    };

    this.http.put<IResponse<IPlanningTicketApi>>(
      `${this.baseUrl}/${idNumber}`,
      payload
    ).subscribe({
      next: (res) => {
        const updatedTicket = this.normalizeTicket(res.data);
        const updatedList = this.ticketsSignal().map(t =>
          t.id === ticket.id ? updatedTicket : t
        );
        this.ticketsSignal.set(updatedList);
        this.selectedTicketSignal.set(updatedTicket);

        this.alertService.displayAlert(
          'success',
          'Estimación guardada correctamente',
          'center',
          'top',
          ['success-snackbar']
        );
      },
      error: () => {
        console.error('Error guardando story points');
        this.alertService.displayAlert(
          'error',
          'Error guardando la estimación',
          'center',
          'top',
          ['error-snackbar']
        );
      }
    });
  }

  startVoting(ticketId: string) {
    const updated: IPlanningTicket[] = this.ticketsSignal().map(
      (ticket): IPlanningTicket => {
        if (ticket.id === ticketId) {
          if (ticket.status === 'Pendiente') {
            return { ...ticket, status: 'Votando' };
          }
          if (ticket.status === 'Votando') {
            return { ...ticket, status: 'Pendiente' };
          }
        }
        return ticket;
      }
    );

    this.ticketsSignal.set(updated);

    const selected = updated.find(t => t.id === ticketId) ?? null;
    this.selectedTicketSignal.set(selected);
    this.selectedCardSignal.set(null);
  }

  finishVoting(ticketId: string) {
    const updated: IPlanningTicket[] = this.ticketsSignal().map(
      (ticket): IPlanningTicket =>
        ticket.id === ticketId
          ? { ...ticket, status: 'Listo' }
          : ticket
    );
    this.ticketsSignal.set(updated);
  }

  deleteTicket(ticketId: string) {
    const idNumber = Number(ticketId);
    if (!idNumber) return;

    this.http.delete<IResponse<null>>(`${this.baseUrl}/${idNumber}`).subscribe({
      next: () => {
        const remaining = this.ticketsSignal().filter(t => t.id !== ticketId);
        this.ticketsSignal.set(remaining);

        const selected = this.selectedTicketSignal();
        if (selected && selected.id === ticketId) {
          this.selectedTicketSignal.set(remaining[0] ?? null);
          this.selectedCardSignal.set(null);
        }

        this.alertService.displayAlert(
          'success',
          'Ticket eliminado correctamente',
          'center',
          'top',
          ['success-snackbar']
        );
      },
      error: () => {
        console.error('Error eliminando ticket');
        this.alertService.displayAlert(
          'error',
          'Error eliminando el ticket de Planning Poker',
          'center',
          'top',
          ['error-snackbar']
        );
      }
    });
  }
}
