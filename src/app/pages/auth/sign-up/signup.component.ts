import { CommonModule } from '@angular/common';
import { Component, ViewChild, ChangeDetectionStrategy, signal, ChangeDetectorRef, inject} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { IUser } from '../../../interfaces';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigUpComponent {
  title = 'Sign Up';
  public signUpError!: String;
  public emailError!: string;
  public validSignup!: boolean;
  private manualDetector: ChangeDetectorRef = inject(ChangeDetectorRef);
  @ViewChild('name') nameModel!: NgModel;
  @ViewChild('lastname') lastnameModel!: NgModel;
  @ViewChild('email') emailModel!: NgModel;
  @ViewChild('password') passwordModel!: NgModel;
  

  hide = true;

  public user: IUser = {
    name: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private router: Router, 
    private authService: AuthService) {}

  public clearError() {
    if (this.signUpError) {
      this.signUpError = '';
      this.manualDetector.markForCheck();
    }
  }

  public handleSignup(event: Event) {
    event.preventDefault();
    if (!this.nameModel.valid) {
      this.nameModel.control.markAsTouched();
    }
    if (!this.lastnameModel.valid) {
      this.lastnameModel.control.markAsTouched();
    }
    if (!this.emailModel.valid) {
      this.emailModel.control.markAsTouched();
    }
    if (!this.passwordModel.valid) {
      this.passwordModel.control.markAsTouched();
    }
    if (this.emailModel.valid && this.passwordModel.valid) {
      this.authService.signup(this.user).subscribe({
        next: () => {
          this.validSignup = true;
          this.manualDetector.markForCheck();
        },
        error: (err: any) => {
          this.signUpError = err.error;
          this.manualDetector.markForCheck();
        },
      });
    }
  }
}