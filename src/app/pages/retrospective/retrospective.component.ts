import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogComponent } from '../../components/confirm/confirm-dialog.component';
import { RetrospectiveService } from '../../services/retrospective.service';

interface RetroNote {
  text: string;
}

interface RetroSection {
  title: string;
  notes: RetroNote[];
}

@Component({
  selector: 'app-retrospective',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbModule,
    RouterModule,
    ButtonModule,
    ConfirmDialogComponent
  ],
  templateUrl: './retrospective.component.html',
  styleUrl: './retrospective.component.scss'
})
export class RetrospectiveComponent{

  scenario: any;
  simulationUser: any;

  constructor(
    private router: Router, 
    private retrospectiveService: RetrospectiveService
  ) {
    const nav = this.router.getCurrentNavigation();
    this.scenario = nav?.extras?.state?.['scenario'];
    this.simulationUser = nav?.extras?.state?.['simulationUser'];

    console.log('Datos recibidos en RetrospectiveComponent:', {
      scenario: this.scenario,
      simulationUser: this.simulationUser
    });
  }


  goBackToCreateSession() {
    this.router.navigate(['app/scenario']);
  }


  sections: RetroSection[] = [
    { title: 'Que nos ayudó?', notes: [{ text: '' }] },
    { title: 'Que nos atrasó?', notes: [{ text: '' }] },
    { title: 'Ideas', notes: [{ text: '' }] },
    { title: 'Acciones', notes: [{ text: '' } ]}
  ];


  confirm = {
    visible: false,
    message: '',
    section: null as RetroSection | null,
    index: null as number | null
  };

  openDeleteDialog(section: RetroSection, index: number) {
    this.confirm = {
      visible: true,
      message: '¿Eliminar esta nota?',
      section,
      index
    };
  }


  openDeleteLastDialog(section: RetroSection) {
    if (section.notes.length === 0) return;

    this.confirm = {
      visible: true,
      message: '¿Eliminar la última nota?',
      section,
      index: null
    };
  }


 onConfirmResult(result: boolean) {
  if (result && this.confirm.section) {

    if (this.confirm.index !== null) {
      this.confirm.section.notes.splice(this.confirm.index, 1);
    } else {
      this.confirm.section.notes.pop();
    }
  }


  this.confirm = {
    visible: false,
    message: '',
    section: null,
    index: null
  };
}

  addNote(section: RetroSection) {
    section.notes.push({ text: '' });
  }

saveToBackend() {

    const payload = {
      scenarioId: this.scenario?.id,
      simulationUserId: this.simulationUser?.id,
      sections: this.sections
    };

    console.log("payload:", payload);

    this.retrospectiveService.saveRetrospective(payload).subscribe({
      next: () => console.log('Guardado exitosamente'),
      error: err => console.error('Error al guardar', err)
    });
  }

}




