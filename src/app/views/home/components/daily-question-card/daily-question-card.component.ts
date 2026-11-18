import { Component } from '@angular/core';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { HomeFeatureCardComponent } from '../../../../shared/components/home-feature-card/home-feature-card.component';
import { TagComponent } from '../../../../shared/components/tag/tag.component';

@Component({
  selector: 'app-daily-question-card',
  standalone: true,
  imports: [IconComponent, HomeFeatureCardComponent, TagComponent],
  templateUrl: './daily-question-card.component.html',
  styleUrl: './daily-question-card.component.scss',
})
export class DailyQuestionCardComponent {}