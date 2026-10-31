import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Shield, FileCheck } from 'lucide-angular';

@Component({
  selector: 'app-legal-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div (click)="$event.stopPropagation()" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <lucide-icon [img]="type === 'terms' ? FileCheck : Shield" [size]="20" class="text-blue-600 dark:text-blue-400"></lucide-icon>
            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ type === 'terms' ? 'Terms of Service' : 'Privacy Policy' }}
            </h3>
          </div>
          <button (click)="close()" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <lucide-icon [img]="X" [size]="18"></lucide-icon>
          </button>
        </div>

        <!-- Content Body -->
        <div class="p-6 overflow-y-auto space-y-4 text-sm text-slate-650 dark:text-slate-300 leading-relaxed">
          <div *ngIf="type === 'terms'">
            <p class="text-xs text-slate-400">Effective Date: October 2026</p>
            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">1. Acceptance of Terms</h4>
            <p>By accessing or using ResumeFlow, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the service.</p>

            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">2. Service Usage</h4>
            <p>ResumeFlow provides automated resume parsing, ATS compatibility checking, and personalized AI interview preparation. You are responsible for ensuring that all resume documents you upload are yours or that you have the right to process them.</p>

            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">3. AI Evaluation Disclaimer</h4>
            <p>AI feedback, scoring, and suggestions are provided for educational and interview preparation purposes only. ResumeFlow does not guarantee hiring outcomes, job offers, or ATS screening approval.</p>

            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">4. Account Security</h4>
            <p>You are responsible for safeguarding your login credentials. Notify us immediately if you suspect unauthorized access to your account.</p>

            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">5. Data Ownership & Deletion</h4>
            <p>You retain full ownership of your uploaded resumes and interview data. You may delete your resumes and associated analyses at any time from your dashboard.</p>
          </div>

          <div *ngIf="type === 'privacy'">
            <p class="text-xs text-slate-400">Effective Date: October 2026</p>
            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">1. Information We Collect</h4>
            <p>We collect information you provide directly, such as your name, email address, password, uploaded resume documents (PDF format), and spoken or typed responses during mock interview sessions.</p>

            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">2. How We Use Your Data</h4>
            <p>Your resume data is used exclusively to generate ATS compatibility reports, highlight missing keywords, and formulate mock interview questions. We do not sell your personal information or resume contents to third parties.</p>

            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">3. AI Processing & Third Parties</h4>
            <p>Resume document extraction is performed through secure parsing APIs (such as Affinda), and interview generation utilizes modern language models. Data is transmitted securely via HTTPS and stored in encrypted databases.</p>

            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">4. Retention & Deletion</h4>
            <p>You can remove your uploaded resumes and interview records at any time. When you request deletion, records are purged from our database immediately.</p>

            <h4 class="font-semibold text-slate-900 dark:text-slate-100 mt-3">5. Contact Us</h4>
            <p>If you have questions regarding our privacy practices or data processing, please contact support&#64;resumeflow.app.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button (click)="close()" class="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class LegalModalComponent {
  @Input() isOpen = false;
  @Input() type: 'terms' | 'privacy' = 'terms';
  @Output() closeEvent = new EventEmitter<void>();

  X = X;
  Shield = Shield;
  FileCheck = FileCheck;

  close() {
    this.closeEvent.emit();
  }
}
