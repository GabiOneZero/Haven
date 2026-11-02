import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { beforeEach, describe, expect, it } from 'vitest';
import { USPage } from './us.page';

describe('USPage', () => {
  let component: USPage;
  let fixture: ComponentFixture<USPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(USPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
