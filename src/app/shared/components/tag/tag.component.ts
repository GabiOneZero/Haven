import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tag',
  standalone: true,
  templateUrl: './tag.component.html',
})
export class TagComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) backgroundColor!: string;
  @Input({ required: true }) textColor!: string;
}
