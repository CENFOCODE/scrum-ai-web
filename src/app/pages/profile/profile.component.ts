import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { FormsModule, NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IUser } from '../../interfaces';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private profileService = inject(ProfileService);
  private destroy$ = new Subject<void>();

  public isLoading = false;
  public successMessage: string | null = null;
  public errorMessage: string | null = null;

  public user: IUser = {
    name: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  public badges = new Array(10);

  @ViewChild('name') nameModel!: NgModel;
  @ViewChild('lastname') lastnameModel!: NgModel;
  @ViewChild('email') emailModel!: NgModel;

  ngOnInit(): void {
    this.profileService.getUserInfoSignal();

    this.profileService.userChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userFromService => {
        if (userFromService) {
          this.user = {
            ...userFromService,
            password: '',
            confirmPassword: ''
          };
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateProfile(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.nameModel && !this.nameModel.valid) this.nameModel.control.markAsTouched();
    if (this.lastnameModel && !this.lastnameModel.valid) this.lastnameModel.control.markAsTouched();
    if (this.emailModel && !this.emailModel.valid) this.emailModel.control.markAsTouched();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email ?? '')) {
      this.errorMessage = 'Por favor ingresa un email válido.';
      return;
    }


    if (this.user.password || this.user.confirmPassword) {
      if (this.user.password !== this.user.confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden.';
        return;
      }

      if (this.user.password && this.user.password.length < 8) {
        this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
        return;
      }
    }

    this.isLoading = true;

const payload: any = {
  name: this.user.name?.trim() ?? '',
  lastname: this.user.lastname?.trim() ?? '',
  email: this.user.email?.trim() ?? ''
};

const password = this.user.password ?? '';
if (password.trim()) {
  payload.password = password;
}


    this.profileService.updateUser(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (updatedUser) => {
          this.user = {
            ...updatedUser,
            password: '',
            confirmPassword: ''
          };

          this.successMessage = 'Perfil actualizado correctamente.';
          setTimeout(() => {
            this.successMessage = null;
          }, 5000);
        },
        error: (err: any) => {
          this.errorMessage =
            err?.error?.description ??
            err?.description ??
            err?.message ??
            'Error al actualizar el perfil. Por favor intenta nuevamente.';
        }
      });
  }
}