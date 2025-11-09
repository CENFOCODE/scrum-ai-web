import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { IUser } from '../../../../interfaces';
import { LayoutService } from '../../../../services/layout.service';
import { MyAccountComponent } from '../../../my-account/my-account.component';
import { BadgeModule } from "primeng/badge";
import { AvatarModule } from "primeng/avatar";
import { MenuModule } from "primeng/menu";
import { ButtonModule } from "primeng/button";
import { MenuItem } from "primeng/api";


@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MyAccountComponent,
    BadgeModule,
    AvatarModule,
    MenuModule,
    ButtonModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: 'topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  public user?: IUser;
  items: MenuItem[] | undefined;


  constructor(
    public router: Router,
    public layoutService: LayoutService,
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
}
