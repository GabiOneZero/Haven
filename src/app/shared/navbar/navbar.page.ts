import { Component, EnvironmentInjector, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';

import { IconComponent } from '../components/icon/icon.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: 'navbar.page.html',
  imports: [IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonLabel, IconComponent],
})
export class NavbarPage {
  public environmentInjector = inject(EnvironmentInjector);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly actionSheetController = inject(ActionSheetController);

  activeTab = signal<string>('home');
  isSigningOut = signal(false);
  signOutError = signal('');

  async openQuickAddMenu(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: '¿Qué quieres añadir?',
      cssClass: 'haven-quick-add-sheet',
      buttons: [
        { text: 'Evento', handler: () => void this.router.navigateByUrl('/tabs/calendar') },
        { text: 'Nota', handler: () => void this.router.navigateByUrl('/tabs/organize') },
        { text: 'Elemento de la compra', handler: () => void this.router.navigateByUrl('/tabs/organize') },
        { text: 'Tarea', handler: () => void this.router.navigateByUrl('/tabs/organize') },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });

    await actionSheet.present();
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
