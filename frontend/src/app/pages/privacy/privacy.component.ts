import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent {
  readonly ArrowLeft = ArrowLeft;
}
