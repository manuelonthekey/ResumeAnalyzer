import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  readonly ArrowLeft = ArrowLeft;
}
