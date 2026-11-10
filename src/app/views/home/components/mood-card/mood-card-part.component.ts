import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mood-card-part',
  standalone: true,
  templateUrl: './mood-card-part.component.html',
  styleUrls: ['./mood-card-part.component.scss'],
})
export class MoodCardPartComponent {
  @Input({ required: true }) state!: string;
  @Input({ required: true }) backgroundColor!: string;
  @Input({ required: true }) textColor!: string;
  @Input({ required: true }) initials!: string;
}
