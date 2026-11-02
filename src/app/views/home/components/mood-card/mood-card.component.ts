import { Component, Input } from '@angular/core';

export interface MoodData {
  id: string;
  name: string;
  mood: string;
  bgColor: string;
}

@Component({
  selector: 'app-mood-card',
  standalone: true,
  imports: [],
  templateUrl: './mood-card.component.html',
  styleUrls: ['./mood-card.component.scss'],
})
export class MoodCardComponent {
  @Input() moodData: MoodData = { id: '', name: '', mood: '', bgColor: '' };
}