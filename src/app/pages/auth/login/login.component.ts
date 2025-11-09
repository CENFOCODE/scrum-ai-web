import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone, signal, ViewChild} from '@angular/core';
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
    private authService: AuthService,
    private ngZone: NgZone
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

  ngOnInit(): void {
    (window as any).handleCredentialResponse = (response: any) =>
      this.handleGoogleCredential(response);
    console.log('Google callback set');
    this.initializeGoogleSignIn();

  }

  initializeGoogleSignIn(): void {
    if ((window as any).google !== 'undefined') {
       this.renderGoogleButton();
    } else {
      setTimeout(() => this.initializeGoogleSignIn(), 1000);
  }
}

  renderGoogleButton(): void {
    try{
     
    (window as any).google.accounts.id.initialize({
      client_id:
        '316836742682-8qljm4bfpqheogsg5eq7v96hl1gn4q65.apps.googleusercontent.com',
      callback: (response: any) => this.handleGoogleCredential(response),
    });
    (window as any).google.accounts.id.renderButton(
      document.querySelector('.g_id_signin'),
      { theme: 'outline', size: 'large' } 
    );
    }
   catch (error) {
      console.error('Error rendering Google button:', error);
    }

  }


  

  public handleGoogleCredential(response: any): void {
    if (!response?.credential) {
      this.ngZone.run(() => {
        this.loginError = 'No credential received from Google';
      });
    return;
  }

  this.authService.loginWithGoogle(response.credential).subscribe({
    next: () => {
      this.ngZone.run(() => {
        this.router.navigateByUrl('/app/dashboard').then(success => {
          console.log('Navigation success:', success);
        });
      });
    },
    error: (err: any) => {
      this.ngZone.run(() => {
        this.loginError = err?.error?.description ?? 'Login failed';
      });
    },
  });
}

protected readonly event = event;
} 
