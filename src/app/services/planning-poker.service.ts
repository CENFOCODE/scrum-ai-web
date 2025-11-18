import { Injectable, signal } from '@angular/core';

export type PlanningTicketStatus = 'Pendiente' | 'Votando' | 'Listo';

export interface IPlanningTicket {
  id: string;
  url?: string;
  name: string;
  description: string;
  code: string;
  status: PlanningTicketStatus;
}

@Injectable({ providedIn: 'root' })
export class PlanningPokerService {
  private participantsSignal = signal<string[]>([
    'Lorem ipsum dolor Rol',
    'Lorem ipsum dolor Rol',
    'Lorem ipsum dolor Rol',
    'Lorem ipsum dolor Rol'
  ]);

  private ticketsSignal = signal<IPlanningTicket[]>([
    {
      id: '1',
      code: 'SC-0',
      name: 'Creación de Planning Poker',
      description: 'Se podrá practicar la estimación colaborativa de historias de usuario usando Planning Poker, seleccionando cartas y gestionando las historias a estimar.',
      status: 'Pendiente' as PlanningTicketStatus
    }
  ]);

  private selectedTicketSignal = signal<IPlanningTicket | null>(
    this.ticketsSignal()[0] ?? null
  );

  private selectedCardSignal = signal<string | null>(null);

  private readonly cards: string[] = [
    '0', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?'
  ];

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

  addTicket(ticket: Omit<IPlanningTicket, 'id' | 'status'>) {
    const current = this.ticketsSignal();

    const newTicket: IPlanningTicket = {
      ...ticket,
      id: (current.length + 1).toString(),
      status: 'Pendiente' as PlanningTicketStatus
    };

    this.ticketsSignal.set([...current, newTicket]);

    this.selectedCardSignal.set(null);
  }

  selectCard(card: string) {
    this.selectedCardSignal.set(card);
  }

  startVoting(ticketId: string) {
    const updated: IPlanningTicket[] = this.ticketsSignal().map(
      (ticket): IPlanningTicket => {
        if (ticket.id === ticketId) {
          return { ...ticket, status: 'Votando' as PlanningTicketStatus };
        }

        if (ticket.status === 'Votando') {
          return { ...ticket, status: 'Pendiente' as PlanningTicketStatus };
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
          ? { ...ticket, status: 'Listo' as PlanningTicketStatus }
          : ticket
    );
    this.ticketsSignal.set(updated);
  }
}
