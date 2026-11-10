import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { MoodService } from '../../../shared/services/mood.service';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: MoodService,
          useValue: {
            getCurrentWorkspaceMoods: async () => [
              {
                userId: 'user-1',
                displayName: 'Gabi',
                mood: 'Con energía',
              },
              {
                userId: 'user-2',
                displayName: 'Aldara',
                mood: 'En calma',
              },
            ],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the latest moods returned by the service', async () => {
    await vi.waitFor(() => expect(component.moodsLoading()).toBe(false));
    expect(component.moods()).not.toBeNull();
    fixture.detectChanges();
    const renderedPage = fixture.nativeElement as HTMLElement;

    expect(renderedPage.textContent).toContain('Con energía');
    expect(renderedPage.textContent).toContain('En calma');
  });
});
