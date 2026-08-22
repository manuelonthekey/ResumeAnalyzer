import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, ArrowLeft, Mic, MicOff, Send, CheckCircle, AlertTriangle, Play, Award, Loader, ChevronRight, Volume2, Target } from 'lucide-angular';

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './interview.component.html',
  styles: ``
})
export class InterviewComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  // Icons
  ArrowLeft = ArrowLeft; Mic = Mic; MicOff = MicOff; Send = Send; CheckCircle = CheckCircle;
  AlertTriangle = AlertTriangle; Play = Play; Award = Award; Loader = Loader;
  ChevronRight = ChevronRight; Volume2 = Volume2; Target = Target;

  id = '';
  sessionIdParam = '';

  interviewHistory = signal<any[]>([]);

  sessionStarted = signal(false);
  sessionEnded = signal(false);
  sessionId = signal<string | null>(null);
  sessionType = signal('behavioral');

  questionNumber = signal(1);
  currentQuestion = signal('');
  userAnswer = signal('');

  loadingQuestion = signal(false);
  loadingFeedback = signal(false);

  feedback = signal<any>(null);
  sessionDetails = signal<any>(null);

  isListening = signal(false);
  recognition: any = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id') || '';
    });
    this.route.queryParamMap.subscribe(queryParams => {
      this.sessionIdParam = queryParams.get('session') || '';
      if (this.sessionIdParam) {
        this.fetchSessionDetails(this.sessionIdParam);
      }
    });

    this.fetchHistory();
    this.initSpeechRecognition();
  }

  ngOnDestroy() {
    if (this.recognition && this.isListening()) {
      this.recognition.stop();
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          this.userAnswer.update(v => v + (v ? ' ' : '') + finalTranscript);
        }
      };

      this.recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        this.isListening.set(false);
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };
    }
  }

  fetchHistory() {
    this.http.get<any[]>('http://localhost:8081/api/v1/interview/sessions').subscribe({
      next: (data) => this.interviewHistory.set(data),
      error: () => {}
    });
  }

  fetchSessionDetails(sid: string) {
    this.http.get<any>(`http://localhost:8081/api/v1/interviews/${sid}`).subscribe({
      next: (data) => {
        this.sessionDetails.set(data);
        this.sessionEnded.set(true);
        this.sessionStarted.set(true);
      },
      error: (e) => console.error(e)
    });
  }

  toggleListening() {
    if (!this.recognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }
    if (this.isListening()) {
      this.recognition.stop();
      this.isListening.set(false);
    } else {
      this.recognition.start();
      this.isListening.set(true);
    }
  }

  handleStartSession() {
    this.loadingQuestion.set(true);
    this.http.post<any>('http://localhost:8081/api/v1/interviews/start', {
      resume_id: this.id,
      session_type: this.sessionType()
    }).subscribe({
      next: (res) => {
        this.sessionId.set(res.session_id);
        this.currentQuestion.set(res.first_question);
        this.sessionStarted.set(true);
        this.questionNumber.set(1);
        this.loadingQuestion.set(false);
      },
      error: (e) => {
        console.error(e);
        alert('Failed to start interview.');
        this.loadingQuestion.set(false);
      }
    });
  }

  handleSubmitAnswer() {
    if (!this.userAnswer().trim()) return;
    this.loadingFeedback.set(true);
    this.http.post<any>(`http://localhost:8081/api/v1/interviews/${this.sessionId()}/answer`, {
      question_number: this.questionNumber(),
      question_text: this.currentQuestion(),
      answer: this.userAnswer()
    }).subscribe({
      next: (res) => {
        this.feedback.set(res.feedback);
        if (this.recognition && this.isListening()) {
          this.recognition.stop();
        }
        this.loadingFeedback.set(false);
      },
      error: (e) => {
        console.error(e);
        alert('Failed to submit answer.');
        this.loadingFeedback.set(false);
      }
    });
  }

  handleNextQuestion() {
    const fb = this.feedback();
    if (!fb) return;
    this.currentQuestion.set(fb.follow_up_question || 'No more questions. Click End Session.');
    this.userAnswer.set('');
    this.feedback.set(null);
    this.questionNumber.update(v => v + 1);
  }

  handleEndSession() {
    this.loadingQuestion.set(true);
    this.http.post<any>(`http://localhost:8081/api/v1/interviews/${this.sessionId()}/end`, {}).subscribe({
      next: () => {
        if (this.sessionId()) this.fetchSessionDetails(this.sessionId()!);
        this.loadingQuestion.set(false);
      },
      error: (e) => {
        console.error(e);
        alert('Failed to end session.');
        this.loadingQuestion.set(false);
      }
    });
  }

  handleSpeakQuestion() {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(this.currentQuestion());
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  reloadWithSession(resumeId: string, sid: string) {
    window.location.href = `/interview/${resumeId}?session=${sid}`;
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
