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
    // RouterLink,
    // RouterLinkActive,
    SidebarModule,
    ButtonModule,
    DividerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: 'sidebar.component.scss'
})
export class SidebarComponent {
  public width: any = window.innerWidth;
  public layoutService = inject(LayoutService);
  public authService = inject(AuthService);
  public permittedRoutes: Route[] = [];
  appRoutes: any;
  @Input() visible: boolean = true;
  @Output() toggle = new EventEmitter<void>();


  constructor(
  ) {
    this.appRoutes = routes.filter(route => route.path == 'app')[0];
    this.permittedRoutes = this.authService.getPermittedRoutes(this.appRoutes.children);
  }
}
