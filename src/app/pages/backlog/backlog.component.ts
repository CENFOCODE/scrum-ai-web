import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem, MessageService } from 'primeng/api';
import { BacklogBoardComponent } from '../../components/backlog-board/backlog-board.component';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { IScenario, ISimulationUser, IScenarioTemplate, ISimulations, ISimulationFeedback } from '../../interfaces';
import { ViewChild } from '@angular/core';
import { BacklogService } from '../../services/backlog.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule, FormsModule, BacklogBoardComponent, ChatbotComponent],
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit {
  @ViewChild(ChatbotComponent) chatbot!: ChatbotComponent;
  
      feedbackText: ISimulationFeedback[] = [];
      simulation: ISimulations = {};
      scenario: IScenario | null = null;
      simulationId: number | null = null;
      simulationUser: ISimulationUser | null = null;
      aiTemplate: IScenarioTemplate | null = null;
      aiQuery: string = '';


  itemsMenu: MenuItem[] | undefined;
  home: MenuItem | undefined;

  constructor(
    private router: Router, 
    private backlogService: BacklogService
  ) {
    const nav = this.router.getCurrentNavigation();
    if(nav?.extras?.state) {
      this.scenario = nav.extras.state['scenario'] || null;
      this.simulationUser = nav.extras.state['simulationUser'] || null;
      this.aiTemplate = nav.extras.state['aiTemplate'] || null;
      this.simulation = nav.extras.state['simulation'] || {};

      this.simulationId = nav.extras.state['simulationId'] || null;

      if (!this.simulationId && this.simulation?.id) {
        this.simulationId = this.simulation.id;
      }

      if (!this.simulationId && this.simulationUser?.simulation?.id) {
        this.simulationId = this.simulationUser.simulation.id;
      }
    }
  }

  ngOnInit(): void {
    this.itemsMenu = [
      { label: 'Planning Paso 1', route: '/app/scenario' },
      { label: 'Planning Paso 2', route: '/app/planning' },
      { label: 'Planning Paso 3', route: '/app/history' }
    ];
    this.home = { label: 'Home', routerLink: '/' };
  }

  goBack() {
    this.router.navigate(['/app/scenario']);
  }

  planData: any = null;

  savePlanning() {
  const payload = {
    simulationUserId: this.simulationUser?.id,
    simulationId: this.simulationId,
    planning: this.aiQuery
  };

  this.planData = payload;

  this.backlogService.savePlanning(payload).subscribe({
    next: (res) => {

      const feedback = res.feedbackMessage;

      setTimeout(() => {
        this.chatbot.messages.push({
          from: 'Scrum AI',
          prompt: feedback
        });
      }, 0);
    },
    error: () => {
    }
  });
}


  finishSimulation() {
  if (!this.simulationId) {
    return;
  }
  this.backlogService.completeSimulation(this.simulationId)
    .subscribe({
      next: (res) => {
  
         const feedback = this.feedbackText;
         this.router.navigate(['/app/feedback'], {
          state: {
            simulationId: this.simulationId,
            scenario: this.scenario,
            simulationUser: this.simulationUser,
            simulation: this.simulation,
            feedback: feedback
          }
        });
      },
      error: (err) => {
        if (err.status === 409) {
  
      } else {
        
      }
    }
    });
  }
}
