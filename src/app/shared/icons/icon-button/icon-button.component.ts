import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  templateUrl: './icon-button.component.html',
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }
      svg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class IconButtonComponent {
  /** Color can be a hex, rgb or a CSS variable like 'var(--name)' */
  @Input() strokeColor: string = 'currentColor';
  @Input() paths: string[] | readonly string[] = [];
}

