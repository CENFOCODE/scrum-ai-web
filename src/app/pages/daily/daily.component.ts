import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SimulationService } from '../../services/simulation.service';

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
    DragDropModule
  ],
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.scss']
})
export class DailyComponent implements OnInit {

  scenario: any;
  simulationUser: any;

  itemsMenu: MenuItem[] | undefined;

  todo: Task[] = [
    { title: 'Diseñar mockups', description: 'Pantallas iniciales del sistema' },
    { title: 'Configurar entorno', description: 'Instalar dependencias Angular' }
  ];

  inProgress: Task[] = [
    { title: 'Desarrollar módulo de login', description: 'Autenticación con JWT' }
  ];

  qa: Task[] = [
    { title: 'Pruebas de integración', description: 'Endpoints backend' }
  ];

  done: Task[] = [
    { title: 'Reunión inicial', description: 'Definición de requerimientos' }
  ];

  connectedLists: string[] = ['todoList', 'inProgressList', 'qaList', 'doneList'];

  constructor(
    private router: Router,
    private simulationService: SimulationService
  ) {}

  ngOnInit() {

    // 1️⃣ Intentamos leer los datos enviados por navegación
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

    console.log("Datos recibidos en DailyComponent via navigation:", state);

    this.scenario = state?.['scenario'] || null;
    this.simulationUser = state?.['simulationUser'] || null;

    // 2️⃣ Si vienen null (por refresh, F5, acceso directo)
    if (!this.scenario) {
      this.scenario = this.simulationService.selectedScenario$();
    }

    if (!this.simulationUser) {
      this.simulationUser = this.simulationService.selectedUser$();
    }

    // 3️⃣ Validación final (si todo está null)
    if (!this.scenario || !this.simulationUser) {
      console.warn("❌ No hay datos cargados. Redirigiendo.");
      this.router.navigate(['app/scenario']);
      return;
    }

    // 4️⃣ Breadcrumb
    this.itemsMenu = [
      { label: 'Daily Paso 1', route:'/app/daily' },
      { label: 'Daily Paso 2' },
      { label: 'Daily Paso 3' }
    ];

    console.log("✔ Datos finales usados en DailyComponent:", {
      scenario: this.scenario,
      simulationUser: this.simulationUser
    });
  }


  trackTask(index: number, task: Task) {
    return task.title;
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

  getDailyBoardState() {
    return {
      todo: this.todo,
      inProgress: this.inProgress,
      qa: this.qa,
      done: this.done
    };
  }

  goNext() {
    const board = this.getDailyBoardState();

    console.log('Estado de la Daily listo para enviar:', board);

    //Guardar board en SimulationService
    this.simulationService.setDailyBoard(board);

    this.router.navigate(['app/daily-questions']);
  }

  goBackToCreateSession() {
    this.router.navigate(['app/scenario']);
  }
}
