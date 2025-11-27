import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { BacklogBoardComponent } from '../../components/backlog-board/backlog-board.component';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule, BacklogBoardComponent],
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit {
  scenario: any;
  simulationUser: any;
  itemsMenu: MenuItem[] | undefined;
  home: MenuItem | undefined;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.scenario = nav?.extras?.state?.['scenario'];
    this.simulationUser = nav?.extras?.state?.['simulationUser'];
  }

  ngOnInit(): void {
    this.itemsMenu = [
      { label: 'Planning Paso 1', route: 'appscenario' },
      { label: 'Planning Paso 2', route: 'appplanning' },
      { label: 'Planning Paso 3', route: 'appbacklog' }
    ];
    this.home = { label: 'Home', routerLink: '/' };
    // Backlog page will show backlog automatically - no sprint creation automatically on load
  }

  goBack() {
    this.router.navigate(['appplanning']);
  }
}
