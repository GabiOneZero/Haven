import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ListsService } from '../../../shared/services/lists.service';
import { OrganizePage } from './organize.page';

describe('OrganizePage', () => {
  let component: OrganizePage;
  let fixture: ComponentFixture<OrganizePage>;

  beforeEach(async () => {
    const listsService = {
      loading: signal(false),
      syncing: signal(false),
      error: signal<string | null>(null),
      lists: signal([]),
      items: signal([]),
      load: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      getActiveLists: vi.fn(() => []),
      getActiveItems: vi.fn(() => []),
      createList: vi.fn(),
      renameList: vi.fn(),
      deleteList: vi.fn(),
      createItem: vi.fn(),
      renameItem: vi.fn(),
      toggleItem: vi.fn(),
      deleteItem: vi.fn(),
      clearCompleted: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [OrganizePage],
      providers: [provideRouter([]), { provide: ListsService, useValue: listsService }],
    }).compileComponents();
    fixture = TestBed.createComponent(OrganizePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
