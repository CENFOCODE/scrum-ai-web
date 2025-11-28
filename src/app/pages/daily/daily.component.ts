import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
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
  styleUrl: './daily.component.scss'
})
export class DailyComponent implements OnInit {

  /** datos del create-scenario */
    scenario: any;
  simulationUser: any;

  constructor(
    private router: Router,
    private simulationService: SimulationService
  ) {
    const nav = this.router.getCurrentNavigation();
    this.scenario = nav?.extras?.state?.['scenario'];
    this.simulationUser = nav?.extras?.state?.['simulationUser'];

    console.log(' Datos recibidos en DailyComponent:', {
      scenario: this.scenario,
      simulationUser: this.simulationUser
    });
  }

  goBackToCreateSession() {
    this.router.navigate(['app/scenario']);
  }



  /** breadcrums menu */ 
itemsMenu: MenuItem[] | undefined;

    home: MenuItem | undefined;

  ngOnInit() {
    this.itemsMenu = [
      { label: 'Daily Paso 1', route:'/app/dashboard' }, { label: 'Daily Paso 2' }, { label: 'Daily Paso 3' }
    ];
  }

/** drag and drop */
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

  connectedLists = ['todoList', 'inProgressList', 'qaList', 'doneList'];

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

  finishSimulation() {
  const simulationId = this.simulationUser?.simulationId;

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