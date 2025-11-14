import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from './elements/topbar/topbar.component';
import { SidebarComponent } from './elements/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopbarComponent,
    SidebarComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrls: ['../../../styles.scss', 'app-layout.component.scss']
})
export class AppLayoutComponent {
  public title?: string;
  sidebarVisible = true;

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  constructor(public layoutService: LayoutService) {
    this.layoutService.title.subscribe((title) => (this.title = title));
  }
}
