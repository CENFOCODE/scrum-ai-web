import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { SimulationService } from '../../services/simulation.service';
import { ViewChild } from '@angular/core';

// Componentes hijos
import { VideoRoomComponent } from '../../components/videoRoom/videoRoom.component';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';

// Interfaces
import { IScenarioTemplate } from '../../interfaces';
import { IScenario } from '../../interfaces';
import { ISimulations } from '../../interfaces';
import { ISimulationUser } from '../../interfaces'; 

interface Task {
  title: string;
  description?: string;
}

@Component({
  selector: 'app-daily',
  standalone: true,
  imports: [
    BreadcrumbModule,
    RouterModule,
    CommonModule,
    DragDropModule,
    VideoRoomComponent,
    ChatbotComponent,
  ],
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.scss']
})
export class DailyComponent implements OnInit {

  @ViewChild(ChatbotComponent) chatbot!: ChatbotComponent;

  /** datos del create-scenario */
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
    private simulationService: SimulationService
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

  ngOnInit() {

    // const navigation = this.router.getCurrentNavigation();
    // const state = navigation?.extras?.state;

    // this.scenario = state?.['scenario'] || this.simulationService.selectedScenario$();
    
    // this.aiTemplate = state?.['aiTemplate'] || null;

    console.log(this.scenario, this.simulationUser);

    if (!this.scenario || !this.simulationUser) {
      console.warn("No hay datos cargados. Redirigiendo.");
      this.router.navigate(['app/scenario']);
      return;
    }

    console.log("🟣 DailyComponent scenario recibido:", this.scenario);

    // --------------------------------------------
    // 1️⃣ Si hay board previo, restaurarlo
    // --------------------------------------------
    const savedBoard = this.simulationService.dailyBoard$();
    if (savedBoard) {
      this.todo = savedBoard.todo || [];
      this.inProgress = savedBoard.inProgress || [];
      this.qa = savedBoard.qa || [];
      this.done = savedBoard.done || [];
      return;
    }

    // --------------------------------------------
    // 2️⃣ SI HAY initialTasks DINÁMICAS → construir Kanban
    // --------------------------------------------
    if (Array.isArray(this.scenario.initialTasks) && this.scenario.initialTasks.length > 0) {
      console.log("✔ Cargando tareas dinámicas desde initialTasks:", this.scenario.initialTasks);

      this.todo = this.scenario.initialTasks.map((t: any) => ({
        title: t.title,
        description: t.description || ""
      }));

      this.inProgress = [];
      this.qa = [];
      this.done = [];
      return;
    }

    // --------------------------------------------
    // 3️⃣ Si no hay tareas dinámicas → fallback
    // --------------------------------------------
    console.warn("⚠ No hay initialTasks dinámicas. Usando default.");
    this.setDefaultBoard();
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