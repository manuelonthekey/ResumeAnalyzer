import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Mail, Lock, User, FileText, ArrowRight } from 'lucide-angular';
import { LegalModalComponent } from '../../components/legal-modal/legal-modal.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, LegalModalComponent],
  templateUrl: './register.component.html',
  styles: ``
})
export class RegisterComponent {
  email = '';
  password = '';
  name = '';
  error = '';
  loading = false;

  legalOpen = false;
  legalType: 'terms' | 'privacy' = 'terms';

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly User = User;
  readonly FileText = FileText;
  readonly ArrowRight = ArrowRight;

  private authService = inject(AuthService);

  openLegal(type: 'terms' | 'privacy') {
    this.legalType = type;
    this.legalOpen = true;
  }

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
