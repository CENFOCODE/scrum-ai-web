import { Component, effect, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { SimulationService } from '../../services/simulation.service';
import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { VideoRoomComponent } from '../../components/videoRoom/videoRoom.component';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { IScenarioTemplate } from '../../interfaces';
import { IScenario } from '../../interfaces';
import { ISimulations } from '../../interfaces';
import { ISimulationUser } from '../../interfaces'; 
import { Ripple, RippleModule } from 'primeng/ripple';
import { ISimulationFeedback } from '../../interfaces';
import { AiService } from '../../services/ai.service';

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
    VideoRoomComponent,
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
    effect(() => {
        const resp = this.aiService.aiResponse$();
        if (resp) {
          console.log("🔥 Respuesta de la IA en Daily:", resp);
          // this.handleIaResponse(resp);
           const tasks = resp
        .split("\n")
        .map(line => line.trim())
        .filter(line =>
          /(TODO|IN_PROGRESS|QA|DONE)\s*-\s*/i.test(line)
        )
        .map(line => {
          // Elimina bullets como "1." o "*" o "-"
          line = line.replace(/^\d+\.\s*/, "").replace(/^\*\s*/, "").trim();

          // Extrae status y descripción
          const match = line.match(/(TODO|IN_PROGRESS|QA|DONE)\s*-\s*(.+)/i);

          if (!match) return null;

          return {
            status: match[1].toUpperCase(),
            title: match[2].trim()
          };
        })
        .filter((t): t is { status: string; title: string } => t !== null);
          
          console.log("Tareas parseadas:", tasks);
          
          this.todo = tasks.filter(t => t?.status === 'TODO') as Task[];
          this.inProgress = tasks.filter(t => t?.status === 'IN_PROGRESS') as Task[];
          this.qa = tasks.filter(t => t?.status === 'QA') as Task[];
          this.done = tasks.filter(t => t?.status === 'DONE') as Task[];

          console.log("Tableros actualizados:", this.todo, this.inProgress, this.qa, this.done);
      }});
  }

  private generateTasksFromPrompt(prompt: string): Task[] {
  if (!prompt) return [];

  const sentences = prompt
    .split(/[\.\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

    return sentences.map(s => ({
      title: s,
      description: ""
  }));
}


  ngOnInit() {

  console.log(this.scenario, this.simulationUser);

  if (!this.scenario || !this.simulationUser) {
    console.warn("No hay datos cargados. Redirigiendo.");
    this.router.navigate(['app/scenario']);
    return;
  }

  // // 1️⃣ Restaurar board previo
  // const savedBoard = this.simulationService.dailyBoard$();
  // if (savedBoard) {
  //   this.todo = savedBoard.todo || [];
  //   this.inProgress = savedBoard.inProgress || [];
  //   this.qa = savedBoard.qa || [];
  //   this.done = savedBoard.done || [];
  //   return;
  // }

  // 2️⃣ SI HAY promptTemplate → generar tareas dinámicas
  // if (this.aiTemplate?.promptTemplate) {
  //   console.log("🟣 Generando tareas del template IA");
  //   this.todo = this.generateTasksFromPrompt(this.aiTemplate.promptTemplate);
  //   console.log("Tareas generadas:", this.todo);
  //   this.inProgress = [];
  //   this.qa = [];
  //   this.done = [];
  //   return;
  // }

  // 3️⃣ fallback
  // console.warn("⚠ No hay tareas dinámicas ni template IA. Usando default.");
  // this.setDefaultBoard();
}


  // BOARD DEFAULT
  private setDefaultBoard() {
    this.todo = [
      { title: 'Diseñar mockups', description: 'Pantallas iniciales del sistema' },
      { title: 'Configurar entorno', description: 'Instalar dependencias Angular' }
    ];

    this.inProgress = [
      { title: 'Desarrollar módulo de login', description: 'Autenticación con JWT' }
    ];

    this.qa = [
      { title: 'Pruebas de integración', description: 'Endpoints backend' }
    ];

    this.done = [
      { title: 'Reunión inicial', description: 'Definición de requerimientos' }
    ];
  }


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

  // Guardar y seguir
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

  // Información de la ceremonia (rol + sala + participantes)
  onCeremonyInfo(info: any) {
    this.simulationService.setDailyCeremonyInfo(info);
  }

  finishSimulation() {
  const simulationId = this.simulationId;

  if (!simulationId) {
    console.error("No simulationId found!");
    return;
  }

  this.simulationService.completeSimulation(simulationId)
    .subscribe({
      next: (res) => {
        console.log("Simulation completed:", res);
        this.router.navigate(['/app/history']); // opcional
      },
      error: (err) => console.error(err)
    });
}
}