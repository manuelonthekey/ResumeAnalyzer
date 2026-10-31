import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, FileText } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
  styles: ``
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  readonly FileText = FileText;

  private authService = inject(AuthService);

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Incorrect email or password.';
        this.loading = false;
      }
    });
  }
}
