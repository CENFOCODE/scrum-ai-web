import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';


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
}