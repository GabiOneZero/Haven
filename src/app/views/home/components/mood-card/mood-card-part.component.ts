import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mood-card-part',
  standalone: true,
  templateUrl: './mood-card-part.component.html',
})
export class MoodCardPartComponent {
  @Input({ required: true }) state!: string;
  @Input({ required: true }) backgroundColor!: string;
  @Input({ required: true }) textColor!: string;
}
