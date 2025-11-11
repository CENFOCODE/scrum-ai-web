import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { IUser } from '../../../../interfaces';
import { LayoutService } from '../../../../services/layout.service';
import { BadgeModule } from "primeng/badge";
import { AvatarModule } from "primeng/avatar";
import { MenuModule } from "primeng/menu";
import { ButtonModule } from "primeng/button";
import { MenuItem } from "primeng/api";
import {OverlayPanelModule} from "primeng/overlaypanel";
import { TooltipModule } from 'primeng/tooltip';



@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    BadgeModule,
    AvatarModule,
    MenuModule,
    ButtonModule,
    OverlayPanelModule,
    TooltipModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: 'topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  public user?: IUser;
  items: MenuItem[] | undefined;

  notifications = [
    { id: 1, message: 'Invitacion recibida!', isRead: false, createdAt: new Date() },
    { id: 2, message: 'Logro desbloqueado', isRead: false, createdAt: new Date() },
  ];

  // notifications: any[] = [];

  constructor(
    public router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.items = [
      {
        label: 'Opciones',
        items: [
          {
            label: 'Perfil',
            icon: 'pi pi-user',
            command: () => this.goProfile()
          },
          {
            label: 'Cerrar sesión',
            icon: 'pi pi-sign-out',
            command: () => this.logout()
          }
        ]
      }
    ];
  }

  public goProfile(): void {
    this.router.navigateByUrl('app/profile');
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  get unreadCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
  }
}
