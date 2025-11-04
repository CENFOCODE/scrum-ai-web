import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, inject } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
import { finalize, take } from 'rxjs/operators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
  @ViewChild('email', { static: false }) emailModel!: NgModel;

  public forgotPasswordForm: { email: string } = { email: '' };
  public forgotPasswordError!: string;
  public forgotPasswordSuccess = false;
  public isLoading = false;

  private manualDetector: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor(private router: Router, private authService: AuthService) {}

  public handleForgotPassword(frm: NgForm) {
    if (!this.emailModel) {
      return;
    }
    if (!this.emailModel.valid) {
      this.emailModel.control.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.forgotPasswordError = '';
    this.forgotPasswordSuccess = false;
    this.manualDetector.markForCheck();

    const emailToSend = this.forgotPasswordForm.email.trim();

    this.authService.forgotPassword(emailToSend).pipe(
      take(1),
      finalize(() => {
        this.isLoading = false;
        this.manualDetector.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.forgotPasswordSuccess = true;
        frm.resetForm();
        this.manualDetector.markForCheck();
       
      },
      error: (err: any) => {
        this.forgotPasswordError = err?.error?.description
          || err?.message
          || 'Error al procesar la solicitud. Por favor intenta nuevamente.';
      }
    });
  }
}