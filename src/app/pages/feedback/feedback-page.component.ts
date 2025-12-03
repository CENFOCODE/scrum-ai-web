import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FeedbackService } from '../../services/feedback.service';
import { ISimulationFeedback } from '../../interfaces';
import { MarkdownModule } from 'ngx-markdown';



@Component({
selector: 'app-feedback-page',
standalone: true,
imports: [CommonModule, MarkdownModule],
templateUrl: './feedback-page.component.html',
styleUrls: ['./feedback-page.component.scss'],
})
export class FeedbackPageComponent {

  feedbackList: ISimulationFeedback[] = [];
  scenario: any = null;
  simulationUser: any = null;
  simulation: any = null;
  feedback: string | undefined;
  simulationId!: number;

  constructor(
    private router: Router,
    public authService: AuthService,
    private feedbackService: FeedbackService

) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state) {
      this.scenario = nav.extras.state['scenario'] || null;
      this.simulationUser = nav.extras.state['simulationUser'] || null;
      this.simulation = nav.extras.state['simulation'] || null;
      this.feedback = nav.extras.state['feedback'] || '';
      this.simulationId = nav?.extras?.state?.['simulationId'];
    }
  }

  ngOnInit() {
  if (!this.simulationId) return;

    this.feedbackService.getFeedbackBySimulation(this.simulationId)
      .subscribe(res => {
        this.feedback = res.message || res.message;

      });
  }
}
