import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-finished-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-finished-view.component.html',
  styleUrls: ['./session-finished-view.component.scss'],
})
export class SessionFinishedViewComponent {

  @Input() scoreFinal!: number;

  @Input() participantes!: string[];

  @Input() userName!: string;
  @Input() userRole!: string;
  @Input() ceremonyName!: string;
  @Input() dificultad!: string;

  @Input() durationFinal!: string;

}
