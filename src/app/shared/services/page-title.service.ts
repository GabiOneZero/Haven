import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private titleSignal = signal('');
  readonly title = this.titleSignal.asReadonly();

  setTitle(title: string): void {
    this.titleSignal.set(title);
  }
}
