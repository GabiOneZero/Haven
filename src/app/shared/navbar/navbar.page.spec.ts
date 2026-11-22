import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';

import { NavbarPage } from './navbar.page';

describe('NavbarPage', () => {
  let component: NavbarPage;
  let fixture: ComponentFixture<NavbarPage>;
  let createActionSheet: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createActionSheet = vi.fn().mockResolvedValue({ present: vi.fn() });
    await TestBed.configureTestingModule({
      imports: [NavbarPage],
      providers: [provideRouter([]), { provide: ActionSheetController, useValue: { create: createActionSheet } }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders child routes inside the tabs outlet', () => {
    expect(fixture.nativeElement.querySelector('ion-tabs ion-router-outlet')).not.toBeNull();
  });

  it('opens the quick-add menu from the central button', async () => {
    fixture.nativeElement.querySelector('button[aria-label="Añadir"]').click();
    await fixture.whenStable();

    expect(createActionSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        header: '¿Qué quieres añadir?',
        cssClass: 'haven-quick-add-sheet',
        buttons: expect.arrayContaining([
          expect.objectContaining({ text: 'Evento' }),
          expect.objectContaining({ text: 'Nota' }),
          expect.objectContaining({ text: 'Elemento de la compra' }),
          expect.objectContaining({ text: 'Tarea' }),
        ]),
      }),
    );
  });
});
