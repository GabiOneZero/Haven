import { CommonModule } from '@angular/common';
import { Component, Input, effect, inject, signal } from '@angular/core';
import type { SafeHtml } from '@angular/platform-browser';

import { IconService } from '../../services/icon.service';


@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="icon-wrapper" [class.filled]="filled" [innerHTML]="svgContent()"></span>`,
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent {
  private iconService = inject(IconService);

  @Input({ required: true }) set name(value: string) {
    this.nameSignal.set(value);
  }

  @Input() filled = false;

  protected nameSignal = signal<string>('');
  protected svgContent = signal<SafeHtml | null>(null);

  constructor() {
    effect(() => {
      const iconName = this.nameSignal();
      if (iconName) {
        this.iconService.getSvg(iconName).subscribe({
          next: (svg) => this.svgContent.set(svg),
          error: (err) => console.error(`Error loading icon: ${iconName}`, err),
        });
      }
    });
  }
}
