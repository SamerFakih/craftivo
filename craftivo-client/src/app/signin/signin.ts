import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router'; // ← Make sure this is imported
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

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
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.css',
})
export class SignIn {
  signinForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder) {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.signinForm.valid) {
      this.isLoading = true;
      console.log('Form submitted:', this.signinForm.value);

      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        // Handle success/error here
      }, 2000);
    }
  }

  get email() {
    return this.signinForm.get('email');
  }
  get password() {
    return this.signinForm.get('password');
  }
}
