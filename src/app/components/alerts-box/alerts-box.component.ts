import { Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { OverlayModule } from 'primeng/overlay';

@Component({
  selector: 'csd-alerts',
  standalone: true,
  imports: [ToastModule, OverlayModule],
  templateUrl: './alerts-box.component.html',
  styleUrls: ['./alerts-box.component.scss']
})
export class AlertsBoxComponent {}
