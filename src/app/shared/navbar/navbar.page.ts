import { Component, EnvironmentInjector, inject, signal } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonLabel, IonRouterOutlet } from '@ionic/angular';
import { IconButtonComponent } from '../icons/icon-button/icon-button.component';
import { IconPaths } from '../constants/icons';

@Component({
  selector: 'app-navbar',
  templateUrl: 'navbar.page.html',
  styleUrls: ['navbar.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel, IconButtonComponent, IonRouterOutlet],
})
export class NavbarPage {
  public environmentInjector = inject(EnvironmentInjector);

  readonly iconPaths = IconPaths;

  activeTab = signal<string>('home');

  onTabChange(event: any) {
    this.activeTab.set(event.tab);
  }

  /**
   * Returns the CSS variable name based on tab state.
   * The actual HEX values live only in variables.scss
   */
  getIconColor(tabName: string): string {
    return this.activeTab() === tabName 
      ? 'var(--haven-icon-selected)' 
      : 'var(--haven-icon-unselected)';
  }
}

