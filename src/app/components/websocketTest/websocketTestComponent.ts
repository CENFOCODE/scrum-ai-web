import { Component } from '@angular/core';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-websocket-test',
  template: `
    <button (click)="connect()">Conectar</button>
    <button (click)="send()">Enviar mensaje</button>
  `
})
export class WebsocketTestComponent {
  constructor(private socketService: SocketService) {}

  connect(): void {
    this.socketService.connect();
  }

  send(): void {
    this.socketService.sendMessage({ user: 'Key', text: 'Hola desde Angular!' });
  }
}
