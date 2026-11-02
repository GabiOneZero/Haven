import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular';
import { HomeIconComponent } from '../icons/home-icon/home-icon.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, IonContent, IonButton, HomeIconComponent],
  template: `
    <div class="app-layout">
      <div class="custom-header">
        <div class="custom-title">{{ title }}</div>
        <div class="header-actions">
          <ion-button fill="clear" class="icon-btn">
            <app-home-icon [paths]="bellPaths" strokeColor="#F5F0E8" />
          </ion-button>
          <ion-button fill="clear" class="icon-btn">
            <app-home-icon [paths]="flamePaths" strokeColor="#171716" />
            <span class="flame-badge">5</span>
          </ion-button>
        </div>
      </div>
      <ion-content>
        <router-outlet></router-outlet>
      </ion-content>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .custom-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: transparent;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .custom-title {
      font-size: 22px;
      font-weight: 700;
      color: #F5F0E8;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .icon-btn {
      --padding-start: 8px;
      --padding-end: 8px;
      --background: transparent;
      --color: transparent;
      min-height: 0;
      height: 40px;
      width: 40px;
      position: relative;
      margin: 0;

      svg {
        width: 22px;
        height: 22px;
      }
    }

    .flame-badge {
      position: absolute;
      top: 6px;
      right: 4px;
      background-color: #F5A623;
      color: #171716;
      font-size: 11px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    ion-content {
      --background: var(--haven-background);
      --padding-top: 0;
      --padding-bottom: 0;
      --padding-start: 0;
      --padding-end: 0;
      flex: 1;
    }
  `]
})
export class AppLayoutComponent implements OnInit {
  title: string = '';
  
  bellPaths = ['M17.5 14.5C17.5 17.5 15 19 12 19C9 19 6.5 17.5 6.5 14.5C6.5 11.5 5 10 5 8.5L5 5C5 3.5 6.5 2 8 2H16C17.5 2 19 3.5 19 5L19 8.5C19 10 17.5 11.5 17.5 14.5Z'];
  flamePaths = ['M12 21C12 21 16 16 16 12C16 9 14 7 12 7C10 7 8 9 8 12C8 16 12 21 12 21Z', 'M12 21C12 21 15 17 15 13'];

  ngOnInit() {
    this.updateTitle();
  }

  updateTitle() {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.title = 'Buenos días';
    } else if (hour < 20) {
      this.title = 'Buenas tardes';
    } else {
      this.title = 'Buenas noches';
    }
  }

  setTitle(title: string) {
    this.title = title;
  }
}
