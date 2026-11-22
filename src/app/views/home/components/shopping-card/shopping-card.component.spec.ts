import { signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ListsService } from '../../../../shared/services/lists.service';

import { ShoppingCardComponent } from './shopping-card.component';

describe('ShoppingCardComponent', () => {
  let component: ShoppingCardComponent;
  let summary: WritableSignal<{ unchecked: number; checked: number }>;

  beforeEach(() => {
    summary = signal({ unchecked: 0, checked: 0 });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ListsService,
          useValue: {
            getShoppingSummary: () => summary(),
          },
        },
      ],
    });

    component = TestBed.runInInjectionContext(() => new ShoppingCardComponent());
  });

  it('uses the green accent when the shopping list has no pending items', () => {
    expect(component.accentColor()).toBe('var(--haven-decision-wheel-green)');
  });

  it('uses the orange accent for one to five unchecked items regardless of checked items', () => {
    summary.set({ unchecked: 5, checked: 7 });

    expect(component.accentColor()).toBe('var(--haven-shopping-accent)');
    expect(component.iconBackgroundColor()).toBe('var(--haven-shopping-icon-bg)');
  });

  it('uses the red accent for six or more unchecked items', () => {
    summary.set({ unchecked: 6, checked: 0 });

    expect(component.accentColor()).toBe('var(--haven-decision-wheel-coral)');
  });

  it('uses the green accent when there are no unchecked items', () => {
    summary.set({ unchecked: 0, checked: 8 });

    expect(component.accentColor()).toBe('var(--haven-decision-wheel-green)');
    expect(component.iconBackgroundColor()).toBe('var(--haven-question-status-bg)');
  });

  it('updates the accent reactively when the shopping summary changes', () => {
    summary.set({ unchecked: 1, checked: 0 });
    expect(component.accentColor()).toBe('var(--haven-shopping-accent)');

    summary.set({ unchecked: 6, checked: 0 });
    expect(component.accentColor()).toBe('var(--haven-decision-wheel-coral)');

    summary.set({ unchecked: 0, checked: 6 });
    expect(component.accentColor()).toBe('var(--haven-decision-wheel-green)');
  });
});
