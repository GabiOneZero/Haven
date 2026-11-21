import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CalendarPage } from './calendar.page';

describe('CalendarPage', () => {
  let component: CalendarPage;
  let fixture: ComponentFixture<CalendarPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts with Ambos and today selected', () => {
    expect(component.filter()).toBe('Ambos');
    expect(component.selectedDate().toDateString()).toBe(new Date().toDateString());
  });

  it('changes filter without changing selected date', () => {
    const selected = component.selectedDate();
    component.setFilter('Personal');
    expect(component.filter()).toBe('Personal');
    expect(component.selectedDate()).toBe(selected);
  });
});
