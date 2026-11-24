import { Component, Input } from '@angular/core';

import { TagComponent } from '../tag/tag.component';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [TagComponent],
  templateUrl: './event-card.component.html',
})
export class EventCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) tagLabel!: string;
  @Input({ required: true }) tagBackgroundColor!: string;
  @Input({ required: true }) tagTextColor!: string;
  @Input({ required: true }) accentColor!: string;
  @Input() metaLines: readonly string[] = [];
}
