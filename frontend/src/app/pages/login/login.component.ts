import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Mail, Lock, FileText, ArrowRight } from 'lucide-angular';

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

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly FileText = FileText;
  readonly ArrowRight = ArrowRight;

  private authService = inject(AuthService);

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to login';
        this.loading = false;
      }
    });
  }
}
