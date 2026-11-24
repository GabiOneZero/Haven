import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    effect,
    input,
    output,
    viewChild,
    viewChildren,
} from '@angular/core';

import { hapticTap } from '../../utils/haptic';
import { IconComponent } from '../icon/icon.component';

import type { QuickAddKind } from './quick-add-actions';
import { QUICK_ADD_ACTIONS } from './quick-add-actions';

/** Focus cannot move into the sheet until the `inert` attribute has been removed. */
const FOCUS_DELAY_MS = 0;

const FOCUSABLE_SELECTOR = 'button:not([disabled])';

@Component({
  selector: 'app-quick-add-sheet',
  imports: [IconComponent],
  templateUrl: './quick-add-sheet.component.html',
  styleUrl: './quick-add-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAddSheetComponent {
  readonly open = input.required<boolean>();
  readonly dismiss = output<void>();
  readonly picked = output<QuickAddKind>();

  protected readonly actions = QUICK_ADD_ACTIONS;

  private readonly sheet = viewChild.required<ElementRef<HTMLElement>>('sheet');
  private readonly tiles = viewChildren<ElementRef<HTMLButtonElement>>('tile');

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      setTimeout(() => this.focusFirstTile(), FOCUS_DELAY_MS);
    });
  }

  protected requestDismiss(): void {
    void hapticTap();
    this.dismiss.emit();
  }

  protected select(kind: QuickAddKind): void {
    void hapticTap();
    this.picked.emit(kind);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestDismiss();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /** Keeps tabbing inside the sheet while it is open. */
  private trapFocus(event: KeyboardEvent): void {
    const controls = Array.from(this.sheet().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (controls.length === 0) {
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !this.sheet().nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirstTile(): void {
    this.tiles()[0]?.nativeElement.focus();
  }
}
