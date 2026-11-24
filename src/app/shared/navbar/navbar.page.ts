import { Component, ElementRef, EnvironmentInjector, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';

import { IconComponent } from '../components/icon/icon.component';
import type { QuickAddKind } from '../components/quick-add/quick-add-actions';
import { QuickAddSheetComponent } from '../components/quick-add/quick-add-sheet.component';
import { AuthService } from '../services/auth.service';

/** Where each quick-add tile takes you. */
const QUICK_ADD_ROUTES: Record<QuickAddKind, string> = {
  event: '/tabs/event-form',
  shopping: '/tabs/organize?list=shopping',
  task: '/tabs/organize',
  note: '/tabs/organize',
};

@Component({
  selector: 'app-navbar',
  templateUrl: 'navbar.page.html',
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel, IconComponent, QuickAddSheetComponent],
})
export class NavbarPage {
  public environmentInjector = inject(EnvironmentInjector);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  activeTab = signal<string>('home');
  isSigningOut = signal(false);
  signOutError = signal('');
  isQuickAddOpen = signal(false);

  private readonly quickAddTrigger = viewChild<ElementRef<HTMLButtonElement>>('quickAddTrigger');

  openQuickAdd(): void {
    this.isQuickAddOpen.set(true);
  }

  closeQuickAdd(): void {
    this.isQuickAddOpen.set(false);
    this.quickAddTrigger()?.nativeElement.focus();
  }

  async onQuickAddPick(kind: QuickAddKind): Promise<void> {
    this.isQuickAddOpen.set(false);
    await this.router.navigateByUrl(QUICK_ADD_ROUTES[kind]);
  }

  onTabChange(event: { tab: string }): void {
    this.activeTab.set(event.tab);
  }

  async onSignOut(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isSigningOut()) {
      return;
    }

    this.isSigningOut.set(true);
    this.signOutError.set('');

    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch {
      this.signOutError.set(
        this.auth.errorMessage() ?? 'No se pudo cerrar la sesión. Comprueba tu conexión e inténtalo de nuevo.',
      );
    } finally {
      this.isSigningOut.set(false);
    }
  }

  /**
   * Returns the CSS variable name based on tab state.
   * The actual HEX values live only in variables.scss
   */
  getIconColor(tabName: string): string {
    return this.activeTab() === tabName ? 'var(--haven-icon-selected)' : 'var(--haven-icon-unselected)';
  }
}
