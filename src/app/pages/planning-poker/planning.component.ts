import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

import { PlanningBoardComponent } from '../../components/planning-board/planning-board.component';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbModule,
    PlanningBoardComponent
  ],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.scss'
})
export class PlanningComponent implements OnInit {

  scenario: any;
  simulationUser: any;

  itemsMenu: MenuItem[] | undefined;
  home: MenuItem | undefined;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.scenario = nav?.extras?.state?.['scenario'];
    this.simulationUser = nav?.extras?.state?.['simulationUser'];

    console.log('Datos recibidos en PlanningComponent:', {
      scenario: this.scenario,
      simulationUser: this.simulationUser
    });
  }

  ngOnInit(): void {
    this.itemsMenu = [
      { label: 'Planning Paso 1', route: '/app/scenario' },
      { label: 'Planning Paso 2' },
      { label: 'Planning Paso 3' }
    ];
  }

  goBackToCreateSession() {
    this.router.navigate(['app/scenario']);
  }
}
