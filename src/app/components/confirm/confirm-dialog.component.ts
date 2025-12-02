import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {

  @Input() visible: boolean = false;
  @Input() message: string = '¿Seguro que deseas eliminar?';

  @Output() onClose = new EventEmitter<boolean>();

  close(value: boolean) {
    this.visible = false;
    this.onClose.emit(value);
  }
}
