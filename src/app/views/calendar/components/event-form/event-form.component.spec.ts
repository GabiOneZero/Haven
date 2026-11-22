import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { expect, it, vi } from 'vitest';

import { EventFormComponent } from './event-form.component';

describe('EventFormComponent', () => {
  it('navigates back to the calendar', async () => {
    await TestBed.configureTestingModule({
      imports: [EventFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EventFormComponent);

    fixture.componentInstance.goBack();

    expect(navigateByUrl).toHaveBeenCalledWith('/tabs/calendar');
  });
});
