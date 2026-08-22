import { environment } from '../../../environments/environment';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, ArrowLeft, Upload, FileText, Loader } from 'lucide-angular';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './upload.component.html',
  styles: ``
})
export class UploadComponent {
  private router = inject(Router);
  private http = inject(HttpClient);

  ArrowLeft = ArrowLeft; Upload = Upload; FileText = FileText; Loader = Loader;

  file = signal<File | null>(null);
  dragging = signal(false);
  loading = signal(false);
  error = signal('');

  handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(true);
  }

  handleDragLeave(e: DragEvent) {
    this.dragging.set(false);
  }

  handleDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const droppedFile = e.dataTransfer?.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      this.file.set(droppedFile);
      this.error.set('');
    } else {
      this.error.set('Please upload a valid PDF file.');
    }
  }

  handleFileChange(event: Event) {
    const selectedFile = (event.target as HTMLInputElement).files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      this.file.set(selectedFile);
      this.error.set('');
    } else {
      this.error.set('Please upload a valid PDF file.');
    }
  }

  clearFile() {
    this.file.set(null);
  }

  handleUpload() {
    const currentFile = this.file();
    if (!currentFile) return;

    this.loading.set(true);
    this.error.set('');
    
    const formData = new FormData();
    formData.append('file', currentFile);

    this.http.post<any>(`${environment.apiUrl}/resumes/upload`, formData).subscribe({
      next: (res) => {
        this.router.navigate([`/analysis/${res.resume_id}`]);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.error?.error || 'Failed to upload and parse resume. Please make sure the Affinda API key is valid.');
        this.loading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
