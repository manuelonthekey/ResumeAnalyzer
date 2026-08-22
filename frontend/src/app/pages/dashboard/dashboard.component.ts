import { environment } from '../../../environments/environment';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, FileText, Plus, LogOut, Trash2, ChevronDown, User, Check, Zap, BookOpen, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styles: ``
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  resumes = signal<any[]>([]);
  feedbackSummary = signal<any>(null);
  interviewHistory = signal<any[]>([]);
  
  resumesLoading = signal(true);
  selectedResumeId = signal('');
  showScoresDropdown = signal(false);
  isDropdownOpen = signal(false);

  // Icons
  FileText = FileText; Plus = Plus; LogOut = LogOut; Trash2 = Trash2; 
  ChevronDown = ChevronDown; User = User; Check = Check; Zap = Zap; 
  BookOpen = BookOpen; ChevronRight = ChevronRight;

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.resumesLoading.set(true);
    // Use proper Spring API paths when they are built
    this.http.get<any[]>(`${environment.apiUrl}/resumes`).subscribe({
      next: (data) => {
        this.resumes.set(data);
        if (data.length > 0 && !this.selectedResumeId()) {
          this.selectedResumeId.set(data[0].id);
        }
        this.resumesLoading.set(false);
      },
      error: () => this.resumesLoading.set(false)
    });

    this.http.get<any>(`${environment.apiUrl}/feedback/summary`).subscribe({
      next: (data) => this.feedbackSummary.set(data),
      error: () => {}
    });

    this.http.get<any[]>(`${environment.apiUrl}/interviews/history`).subscribe({
      next: (data) => this.interviewHistory.set(data),
      error: () => {}
    });
  }

  handleDeleteResume(event: Event, id: string, filename: string) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${filename}"? All associated analyses and interview sessions will be permanently lost.`)) {
      this.http.delete(`${environment.apiUrl}/resumes/${id}`).subscribe({
        next: () => {
          this.fetchData();
          this.selectedResumeId.set('');
        },
        error: (err) => alert(err.error?.error || 'Failed to delete resume')
      });
    }
  }

  handleLogout() {
    this.authService.logout();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  get avgScore(): number {
    return this.feedbackSummary()?.avg_score || 0;
  }
}
