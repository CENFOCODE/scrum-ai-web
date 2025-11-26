import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogComponent } from '../../components/confirm/confirm-dialog.component';
import { RetrospectiveService } from '../../services/retrospective.service';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { IScenario, ISimulationUser, IScenarioTemplate, ISimulations } from '../../interfaces';
import { SimulationService } from '../../services/simulation.service';

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
    ConfirmDialogComponent,
    ChatbotComponent
  ],
  templateUrl: './retrospective.component.html',
  styleUrl: './retrospective.component.scss'
})
export class RetrospectiveComponent implements OnInit{


    simulation: ISimulations = {};
    scenario: IScenario | null = null;
    simulationId: number | null = null;
    simulationUser: ISimulationUser | null = null;
    aiTemplate: IScenarioTemplate | null = null;

  constructor(
    private router: Router, 
    private retrospectiveService: RetrospectiveService,

  ) {
    // Obtenemos los datos pasados desde create-session
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

saveRetrospective() {

  const payloadSections: any = {
    good: [],
    bad: [],
    ideas: [],
    actions: []
  };

  for (const section of this.sections) {
      const cleanValues = section.notes
        .map(n => n.text.trim())
        .filter(t => t !== '');

      switch (section.title) {
        case 'Que nos ayudó?':
          payloadSections.good = cleanValues;
          break;

        case 'Que nos atrasó?':
          payloadSections.bad = cleanValues;
          break;

        case 'Ideas':
          payloadSections.ideas = cleanValues;
          break;

        case 'Acciones':
          payloadSections.actions = cleanValues;
          break;
      }
    }

  const payload = {
    simulationId: this.simulationId,
    retrospective: payloadSections
  };

  console.log("Payload final que se enviará:", payload);

  this.retrospectiveService.saveRetrospective(payload).subscribe({
    next: (res) => {
      console.log("Guardado en backend:", res);
      alert("¡Notas guardadas correctamente!");
    },
    error: (err) => {
      console.error(err);
      alert("Error guardando las notas.");
    }
  });
}

  ngOnInit() {
  console.log("SimulationId reconocido:", this.simulationId);
  }

}




