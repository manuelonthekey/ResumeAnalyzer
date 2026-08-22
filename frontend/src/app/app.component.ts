import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AmbientGlowComponent } from './components/ambient-glow/ambient-glow.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AmbientGlowComponent],
  template: `
    <app-ambient-glow></app-ambient-glow>
    <main class="min-h-screen">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend-angular';
}
