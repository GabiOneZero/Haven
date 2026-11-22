import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentedTabOption {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

@Component({
  selector: 'app-segmented-tabs',
  standalone: true,
  templateUrl: './segmented-tabs.component.html',
  styleUrl: './segmented-tabs.component.scss',
})
export class SegmentedTabsComponent {
  @Input() options: readonly SegmentedTabOption[] = [];
  @Input() activeId = '';
  @Input() ariaLabel = '';
  @Output() tabChange = new EventEmitter<string>();

  select(option: SegmentedTabOption): void {
    if (!option.disabled) {
      this.tabChange.emit(option.id);
    }
  }
}
