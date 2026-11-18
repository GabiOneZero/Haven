import { Component } from '@angular/core';

import { HomeFeatureCardComponent } from '../../../../shared/components/home-feature-card/home-feature-card.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-decision-card',
  standalone: true,
  imports: [HomeFeatureCardComponent, IconComponent],
  templateUrl: './decision-card.component.html',
  styleUrl: './decision-card.component.scss',
})
export class DecisionCardComponent {}