import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../../services/layout.service';
import { AuthService } from '../../../../services/auth.service';
import { routes } from '../../../../app.routes';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import {DividerModule} from "primeng/divider";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    SidebarModule,
    ButtonModule,
    DividerModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: 'sidebar.component.scss'
})
export class SidebarComponent {
  public width: any = window.innerWidth;
  public authService = inject(AuthService);
  public permittedRoutes: Route[] = [];
  appRoutes: any;
  @Input() visible: boolean = true;
  @Output() toggle = new EventEmitter<void>();
  historyOpen = true;
  pausedOpen = true;

  chevronDown = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
    <path d="M297.4 470.6C309.9 483.1 330.2 483.1 342.7 470.6L534.7 278.6C547.2 266.1 547.2 245.8 534.7 233.3C522.2 220.8 501.9 220.8 489.4 233.3L320 402.7L150.6 233.4C138.1 220.9 117.8 220.9 105.3 233.4C92.8 245.9 92.8 266.2 105.3 278.7L297.3 470.7z"/>
    </svg>
`;

  chevronUp = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
    <path d="M471.1 297.4C483.6 309.9 483.6 330.2 471.1 342.7L279.1 534.7C266.6 547.2 246.3 547.2 233.8 534.7C221.3 522.2 221.3 501.9 233.8 489.4L403.2 320L233.9 150.6C221.4 138.1 221.4 117.8 233.9 105.3C246.4 92.8 266.7 92.8 279.2 105.3L471.2 297.3z"/>
    </svg>
`;


  // history = [
  //   { id: 1, title: 'Daily', date: '2025-02-20' },
  //   { id: 2, title: 'Review Sprint', date: '2025-02-18' },
  // ];

  history: any[] = [];


  // paused = [
  //   { title: 'Retrospective' },
  //   { title: 'Sprint Planning' }
  // ];

  paused: any[] = [];

  toggleHistory() {
    this.historyOpen = !this.historyOpen;
  }

  togglePaused() {
    this.pausedOpen = !this.pausedOpen;
  }

  constructor(
  ) {
    this.appRoutes = routes.filter(route => route.path == 'app')[0];
    this.permittedRoutes = this.authService.getPermittedRoutes(this.appRoutes.children);
  }
}
