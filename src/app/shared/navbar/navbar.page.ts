import { Component, EnvironmentInjector, inject, signal } from '@angular/core';
import { IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { IconComponent } from '../components/icon/icon.component';

@Component({
  selector: 'app-navbar',
  templateUrl: 'navbar.page.html',
  styleUrls: ['navbar.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel, IconComponent],
})
export class NavbarPage {
  public environmentInjector = inject(EnvironmentInjector);

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

