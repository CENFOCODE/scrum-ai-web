import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { BacklogBoardComponent } from '../../components/backlog-board/backlog-board.component';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule, BacklogBoardComponent, ChatbotComponent],
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
      { label: 'Planning Paso 1', route: '/app/scenario' },
      { label: 'Planning Paso 2', route: '/app/planning' },
      { label: 'Planning Paso 3', route: '/app/backlog' }
    ];
    this.home = { label: 'Home', routerLink: '/' };
  }

  goBack() {
    this.router.navigate(['/app/planning']);
  }
}
