import { environment } from '../../../environments/environment';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, ArrowLeft, User, Mail, Briefcase, Linkedin, Github, Globe, Upload, Check, Loader } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  // Icons
  ArrowLeft = ArrowLeft; User = User; Mail = Mail; Briefcase = Briefcase;
  Linkedin = Linkedin; Github = Github; Globe = Globe; Upload = Upload;
  Check = Check; Loader = Loader;

  isLoading = signal(true);
  isSaving = signal(false);

  formData = {
    name: '',
    profile_picture: '',
    preferred_roles: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  };

  profileEmail = '';

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/profile`).subscribe({
      next: (data) => {
        this.profileEmail = data.email || '';
        this.formData = {
          name: data.name || '',
          profile_picture: data.profile_picture || '',
          preferred_roles: data.preferred_roles || '',
          linkedin_url: data.linkedin_url || '',
          github_url: data.github_url || '',
          portfolio_url: data.portfolio_url || ''
        };
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      this.formData.profile_picture = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    this.isSaving.set(true);
    this.http.put<any>(`${environment.apiUrl}/profile`, this.formData).subscribe({
      next: (res) => {
        this.authService.user.set(res.user);
        alert('Profile updated successfully!');
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.error || 'Failed to update profile.');
        this.isSaving.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
