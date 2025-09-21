import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // ← Make sure this is imported
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FloatLabelModule,
    InputTextModule,
    ButtonModule,
    HttpClientModule,
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.css',
})
export class SignIn {
  signinForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.signinForm.valid) {
      this.isLoading = true;
      const { email, password } = this.signinForm.value;
      this.authService.login(email, password).subscribe({
        next: (result: any) => {
          this.isLoading = false;
          // Navigate to dashboard or another page upon successful login
          console.log('Login successful:', result);
          this.router.navigate(['/dashboard/overview']);
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Login failed:', error);
        },
      });
    }
  }

  get email() {
    return this.signinForm.get('email');
  }
  get password() {
    return this.signinForm.get('password');
  }
}
