import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  constructor(private messageService: MessageService) {}

  success(message: string = 'Acción completada') {
    this.messageService.add({
      severity: 'success',
      summary: '',
      detail: message,
      life: 3500
    });
  }

  warning(message: string = 'Atención: Revisa los datos') {
    this.messageService.add({
      severity: 'warn',
      summary: '',
      detail: message,
      life: 3500
    });
  }

  error(message: string = 'Error! No se puede procesar') {
    this.messageService.add({
      severity: 'error',
      summary: '',
      detail: message,
      life: 3500
    });
  }
}
