import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-home-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      @for (path of paths; track $index) {
        <path
          [attr.d]="path"
          [attr.stroke]="strokeColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      }
    </svg>
  `,
})
export class HomeIconComponent {
  @Input() paths: string[] | readonly string[] = [];
  @Input() strokeColor: string = 'currentColor';
}
