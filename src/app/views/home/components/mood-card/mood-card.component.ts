import { Component, Input } from '@angular/core';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { TagComponent } from '../../../../shared/components/tag/tag.component';

import { MoodCardPartComponent } from './mood-card-part.component';

export interface MoodData {
  id: string;
  name: string;
  mood: string;
  bgColor: string;
  moodColor: string;
  initials: string;
}

@Component({
  selector: 'app-mood-card',
  standalone: true,
  imports: [IconComponent, TagComponent, MoodCardPartComponent],
  templateUrl: './mood-card.component.html',
})
export class MoodCardComponent {
  @Input({ required: true }) firstMood!: MoodData;
  @Input({ required: true }) secondMood!: MoodData;

  get showMoodsHeart(): boolean {
    return this.firstMood.mood === this.secondMood.mood;
  }
}
