import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, ArrowLeft, Award, FileText, CheckCircle, AlertTriangle, Lightbulb, BookOpen, Briefcase, Code, Star, Loader } from 'lucide-angular';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './analysis.component.html',
  styles: ``
})
export class AnalysisComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  // Icons
  ArrowLeft = ArrowLeft; Award = Award; FileText = FileText; CheckCircle = CheckCircle;
  AlertTriangle = AlertTriangle; Lightbulb = Lightbulb; BookOpen = BookOpen;
  Briefcase = Briefcase; Code = Code; Star = Star; Loader = Loader;

  id = '';
  activeTab = signal<'structure' | 'analysis'>('structure');
  jdText = signal('');
  
  resume = signal<any>(null);
  resumeLoading = signal(true);
  
  analyses = signal<any[]>([]);
  analyzeLoading = signal(false);
  analyzeError = signal('');

  parsed = computed(() => this.resume()?.parsed_structure || {});
  latestAnalysis = computed(() => this.analyses()[0]?.analysis_result || null);

  displaySkills = computed(() => {
    const s = this.parsed().skills || {};
    const list = [
      ...(s.all || []),
      ...(s.languages || []),
      ...(s.frameworks || []),
      ...(s.tools || []),
      ...(s.other || [])
    ].filter(Boolean);
    return [...new Set(list)];
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id') || '';
      if (this.id) {
        this.fetchData();
      }
    });
  }

  fetchData() {
    this.resumeLoading.set(true);
    
    this.http.get<any>(`http://localhost:8081/api/v1/resumes/${this.id}`).subscribe({
      next: (data) => {
        this.resume.set(data);
        this.resumeLoading.set(false);
      },
      error: () => this.resumeLoading.set(false)
    });

    this.fetchAnalyses();
  }

  fetchAnalyses() {
    this.http.get<any[]>(`http://localhost:8081/api/v1/analysis/${this.id}`).subscribe({
      next: (data) => this.analyses.set(data),
      error: () => {}
    });
  }

  runAnalysis() {
    this.analyzeLoading.set(true);
    this.analyzeError.set('');

    this.http.post<any>('http://localhost:8081/api/v1/analysis/analyze', {
      resume_id: this.id,
      jd_text: this.jdText()
    }).subscribe({
      next: () => {
        this.fetchAnalyses();
        this.activeTab.set('analysis');
        this.analyzeLoading.set(false);
      },
      error: (err) => {
        this.analyzeError.set(err.error?.error || 'Failed to analyze resume');
        this.analyzeLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
