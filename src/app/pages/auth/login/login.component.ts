import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal, ViewChild} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DividerModule } from "primeng/divider";
import { MatFormFieldModule} from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { MatIconModule} from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: 'app-login',
  standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        DividerModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule
    ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})

export class LoginComponent {
  public loginError!: string;
  private manualDetector: ChangeDetectorRef = inject(ChangeDetectorRef);
  @ViewChild('email') emailModel!: NgModel;
  @ViewChild('password') passwordModel!: NgModel;
  hide = signal(true);

  public loginForm: { email: string; password: string } = {
    email: '',
    password: '',
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

    clickEvent(event: MouseEvent) {
        this.hide.set(!this.hide());
        event.stopPropagation();
    }

    public clearError() {
        if (this.loginError) {
            this.loginError = '';
            this.manualDetector.markForCheck();
        }
    }

  public handleLogin(event: Event) {
    event.preventDefault();
    if (this.emailModel.valid && this.passwordModel.valid) {
      this.authService.login(this.loginForm).subscribe({
        next: () => {
            this.manualDetector.markForCheck();
            this.router.navigateByUrl('/app/dashboard');
        },
        error: (err: any) => {
            this.manualDetector.markForCheck();
            this.loginError = err.error.description;
        },
      });
    }
  }

    protected readonly event = event;
}
