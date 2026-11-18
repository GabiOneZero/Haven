import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-home-feature-card',
  standalone: true,
  templateUrl: './home-feature-card.component.html',
  styleUrl: './home-feature-card.component.scss',
})
export class HomeFeatureCardComponent {
  @Input({ required: true }) accentColor!: string;
}
