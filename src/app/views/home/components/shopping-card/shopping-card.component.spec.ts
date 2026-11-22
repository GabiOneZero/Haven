import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ListsService } from '../../../../shared/services/lists.service';

import { ShoppingCardComponent } from './shopping-card.component';

describe('ShoppingCardComponent', () => {
  let component: ShoppingCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ListsService,
          useValue: {
            lists: signal([]),
            items: signal([]),
            getShoppingSummary: () => ({ pending: 0, completed: 0 }),
          },
        },
      ],
    });

    component = TestBed.runInInjectionContext(() => new ShoppingCardComponent());
  });

  it('keeps the normal accent while loading and for up to six items', () => {
    expect(component.accentColor).toBe('var(--haven-shopping-accent)');

    component.summaryLoading.set(false);
    component.itemCount.set(6);

    expect(component.accentColor).toBe('var(--haven-shopping-accent)');
  });

  it('uses the red accent above six items', () => {
    component.summaryLoading.set(false);
    component.itemCount.set(7);

    expect(component.accentColor).toBe('var(--haven-decision-wheel-coral)');
  });

  it('uses the green accent when the list is empty', () => {
    component.summaryLoading.set(false);
    component.itemCount.set(0);

    expect(component.accentColor).toBe('var(--haven-decision-wheel-green)');
  });
});
