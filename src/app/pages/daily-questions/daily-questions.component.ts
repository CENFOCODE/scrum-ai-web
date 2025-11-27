import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-daily-questions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './daily-questions.component.html',
  styleUrls: ['./daily-questions.component.scss']
})
export class DailyQuestionsComponent implements OnInit {

  board: any;

  answers = {
    yesterday: '',
    today: '',
    impediments: ''
  };

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.board = nav?.extras?.state?.['board'];

    // 🔥 Seguridad: si se entra directo o con F5
    if (!this.board) {
      this.router.navigate(['app/daily']);
    }
  }

  ngOnInit() {}

  goBack() {
    this.router.navigate(['app/daily'], {
      state: { board: this.board }
    });
  }

  goNext() {
    // Validación simple para evitar errores
    if (!this.answers.yesterday || !this.answers.today) {
      alert("Por favor completa lo que hiciste ayer y lo que harás hoy.");
      return;
    }

    this.router.navigate(['app/daily-summary'], {
      state: {
        board: this.board,
        answers: this.answers
      }
    });
  }
}
