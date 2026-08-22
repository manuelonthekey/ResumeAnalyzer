import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Mail, Lock, User, FileText, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.component.html',
  styles: ``
})
export class RegisterComponent {
  email = '';
  password = '';
  name = '';
  error = '';
  loading = false;

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly User = User;
  readonly FileText = FileText;
  readonly ArrowRight = ArrowRight;

  private authService = inject(AuthService);

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.authService.register({ email: this.email, password: this.password, name: this.name }).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
