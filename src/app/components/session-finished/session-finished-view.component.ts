import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-session-finished-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './session-finished-view.component.html',
  styleUrls: ['./session-finished-view.component.scss']
})
export class SessionFinishedViewComponent {
  @Input() participantes: string[] = [];
  @Input() durationOne: string = '';
  @Input() durationTwo: string = '';
}
