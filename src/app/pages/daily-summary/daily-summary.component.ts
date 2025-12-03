import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-daily-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule
  ],
  templateUrl: './daily-summary.component.html',
  styleUrls: ['./daily-summary.component.scss']
})
export class DailySummaryComponent implements OnInit {

  board: any = null;
  answers: any = null;

  summaryAI: string | undefined = "";
  loadingAI = false;

  constructor(
    private router: Router,
    private aiService: AiService
  ) {
    const nav = this.router.getCurrentNavigation();
    this.board = nav?.extras?.state?.['board'] ?? null;
    this.answers = nav?.extras?.state?.['answers'] ?? null;

    // Si NO hay datos → volver al paso 1
    if (!this.board || !this.answers) {
      this.router.navigate(['app/daily']);
    }
  }

  ngOnInit() {
    if (this.board && this.answers) {
      this.generateAISummary();
    }
  }

  goBack() {
    this.router.navigate(['app/daily-questions'], {
      state: { board: this.board }
    });
  }

  finish() {
  const payload = {
    answers: this.answers,
    board: this.board,
    aiSummary: this.summaryAI
  };

  fetch("http://localhost:8080/api/daily/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(() => this.router.navigate(['app/dashboard']))
  .catch(err => console.error("Error al guardar daily:", err));
}


  /** Construye el prompt y lo envía a Groq */
  generateAISummary() {
    this.loadingAI = true;

    // FUNCION SEGURA para evitar errores TS
    const safeList = (list: any[]) =>
      Array.isArray(list) && list.length > 0
        ? list.map(t => "- " + t.title).join("\n")
        : "N/A";

    const prompt = `
Eres un Scrum Master experto. Evalúa esta información de un Daily Scrum:

Ayer:
${this.answers?.yesterday}

Hoy:
${this.answers?.today}

Impedimentos:
${this.answers?.impediments}

Tareas TO DO:
${safeList(this.board?.todo)}

Tareas en progreso:
${safeList(this.board?.inProgress)}

Tareas en QA:
${safeList(this.board?.qa)}

Tareas completadas:
${safeList(this.board?.done)}

Genera un reporte profesional con esta estructura:
1. Resumen general del progreso.
2. Prioridades principales del día.
3. Riesgos críticos detectados.
4. Recomendaciones del Scrum Master.
5. Enfoque sugerido para el usuario hoy.
`;

    this.aiService.askAI({ prompt }).subscribe({
      next: (res) => {
        this.summaryAI = res.data.answer;
        this.loadingAI = false;
      },
      error: () => {
        this.summaryAI = "Error al generar el resumen con IA.";
        this.loadingAI = false;
      }
    });
  }
}
