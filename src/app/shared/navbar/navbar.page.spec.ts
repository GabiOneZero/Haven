import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { NavbarPage } from './navbar.page';

describe('NavbarPage', () => {
  let component: NavbarPage;
  let fixture: ComponentFixture<NavbarPage>;
  let router: Router;

  const quickAddButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button[aria-label="Añadir"]');

  const quickAddSheet = (): HTMLElement => fixture.nativeElement.querySelector('#quick-add-sheet');

  const quickAddTiles = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.quick-add__tile')) as HTMLButtonElement[];

  const tileLabels = (): string[] =>
    (Array.from(fixture.nativeElement.querySelectorAll('.quick-add__label')) as HTMLElement[])
      .map((label) => label.textContent?.trim() ?? '')
      .filter((label) => label.length > 0);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders child routes inside the tabs outlet', () => {
    expect(fixture.nativeElement.querySelector('ion-tabs ion-router-outlet')).not.toBeNull();
  });

  it('keeps the quick-add sheet closed by default', () => {
    expect(quickAddSheet().classList.contains('quick-add--open')).toBe(false);
    expect(quickAddButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the quick-add sheet from the central button', async () => {
    quickAddButton().click();
    await fixture.whenStable();

    expect(quickAddSheet().classList.contains('quick-add--open')).toBe(true);
    expect(quickAddButton().getAttribute('aria-expanded')).toBe('true');
  });

  it('offers one tile per quick-add action', () => {
    expect(tileLabels()).toEqual(['Evento', 'Compra', 'Tarea', 'Nota']);
  });

  it('closes the sheet when an action is picked and routes to it', async () => {
    component.openQuickAdd();
    await fixture.whenStable();

    quickAddTiles()[1].click();
    await fixture.whenStable();

    expect(component.isQuickAddOpen()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/organize?list=shopping');
  });

  it('routes a new event to the event form', async () => {
    component.openQuickAdd();
    await fixture.whenStable();

    quickAddTiles()[0].click();
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/event-form');
  });

  it('closes the sheet when the backdrop is tapped', async () => {
    component.openQuickAdd();
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.quick-add__backdrop') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(component.isQuickAddOpen()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
