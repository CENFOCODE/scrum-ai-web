import { Component, effect, OnInit, ViewChild } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SimulationService } from '../../services/simulation.service';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { IScenarioTemplate, IScenario, ISimulations, ISimulationUser, ISimulationFeedback } from '../../interfaces';
import { RippleModule } from 'primeng/ripple';
import { AiService } from '../../services/ai.service';
import { DailyService } from '../../services/daily.service';

interface Task {
  title?: string;
  description?: string;
}

@Component({
  selector: 'app-daily',
  standalone: true,
  imports: [
    BreadcrumbModule,
    FormsModule,
    RouterModule,
    CommonModule,
    DragDropModule,
    ChatbotComponent,
    RippleModule,
    ToastModule,
  ],
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.scss'],
  providers: [MessageService]
})
export class DailyComponent implements OnInit {

  @ViewChild(ChatbotComponent) chatbot!: ChatbotComponent;


  /** datos del create-scenario */
  feedbackText: ISimulationFeedback[] = [];
  simulation: ISimulations = {};
  scenario: IScenario | null = null;
  simulationId: number | null = null;
  simulationUser: ISimulationUser | null = null;
  aiTemplate: IScenarioTemplate | null = null;

  itemsMenu: MenuItem[] | undefined;

  todo: Task[] = [];
  inProgress: Task[] = [];
  qa: Task[] = [];
  done: Task[] = [];

  connectedLists: string[] = ['todoList', 'inProgressList', 'qaList', 'doneList'];

  constructor(
    private router: Router,
    private simulationService: SimulationService,
    private messageService: MessageService,
    private aiService: AiService,
    private dailyService: DailyService
  ) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state) {
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

    effect(() => {
      const resp = this.aiService.aiResponse$();
      if (resp) {
        console.log(" Respuesta de la IA en Daily:", resp);

        const tasks = resp
          .split("\n")
          .map(line => line.trim())
          .filter(line => /(TODO|IN_PROGRESS|QA|DONE)\s*-\s*/i.test(line))
          .map(line => {
            line = line.replace(/^\d+\.\s*/, "").replace(/^\*\s*/, "").trim();

            const match = line.match(/(TODO|IN_PROGRESS|QA|DONE)\s*-\s*(.+)/i);
            if (!match) return null;

            return {
              status: match[1].toUpperCase(),
              title: match[2].trim()
            };
          })
          .filter((t): t is { status: string; title: string } => t !== null);

        console.log("Tareas parseadas:", tasks);

        this.todo = tasks.filter(t => t.status === 'TODO') as Task[];
        this.inProgress = tasks.filter(t => t.status === 'IN_PROGRESS') as Task[];
        this.qa = tasks.filter(t => t.status === 'QA') as Task[];
        this.done = tasks.filter(t => t.status === 'DONE') as Task[];

        console.log("Tableros actualizados:", this.todo, this.inProgress, this.qa, this.done);
      }
    });

    effect(() => {
      const chat = this.aiService.aiChat$();
      console.log("Chat IA actualizado en Daily:", chat);
    });
  }
  

  ngOnInit() {
    console.log(this.scenario, this.simulationUser);

    if (!this.scenario || !this.simulationUser) {
      console.warn("No hay datos cargados. Redirigiendo.");
      this.router.navigate(['app/scenario']);
      return;
    }
  }

  // ----------------------------------
  // BOARD DRAG & DROP
  // ----------------------------------
  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  // ----------------------------------
  // GUARDAR DAILY
  // ----------------------------------
  dailyData: {} = {};

  saveDaily() {
  const payload = {
      simulationUserId: this.simulationUser?.id,
      simulationId: this.simulationId,
      daily: this.aiService.aiChat$(),
  };

  this.dailyService.saveDaily(payload).subscribe({
    next: (res) => {

      const feedback = res.feedbackMessage;  

      this.chatbot.messages.push({
        from: 'Scrum AI',
        prompt: feedback
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Daily guardada correctamente.'
      });
    },
    error: () => {
      this.messageService.add({
        severity:'error',
        summary:'Error',
        detail:'Error al guardar la Daily.'
      });
    }
  });
}


  // ----------------------------------
  // FINALIZAR SIMULACIÓN
  // ----------------------------------
  finishSimulation() {
    if (!this.simulationId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el ID de la simulación.'
      });
      return;
    }

    this.dailyService.completeSimulation(this.simulationId).subscribe({

      next: () => {
        const feedback = this.aiService.aiResponse$();

        this.router.navigate(['/app/feedback'], {
          state: {
            simulationId: this.simulationId,
            scenario: this.scenario,
            simulationUser: this.simulationUser,
            simulation: this.simulation,
            feedback
          }
        });
      },

      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al finalizar la simulación.'
        });
      }
    });
  }

  goNext() {
    const board = {
      todo: this.todo,
      inProgress: this.inProgress,
      qa: this.qa,
      done: this.done
    };

    this.simulationService.setDailyBoard(board);
    this.router.navigate(['app/daily-questions']);
  }

  goBackToCreateSession() {
    this.router.navigate(['/app/scenario']);
  }

  onCeremonyInfo(info: any) {
    this.simulationService.setDailyCeremonyInfo(info);
  }
}
