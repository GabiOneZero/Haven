import type { Routes } from '@angular/router';

import { NavbarPage } from './navbar.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: NavbarPage,
    children: [
      { path: 'home', loadComponent: () => import('../../views/home/page/home.page').then(m => m.HomePage) },
      { path: 'calendar', loadComponent: () => import('../../views/calendar/page/calendar.page').then(m => m.CalendarPage) },
      { path: 'organize', loadComponent: () => import('../../views/organize/page/organize.page').then(m => m.OrganizePage) },
      { path: 'us', loadComponent: () => import('../../views/us/page/us.page').then(m => m.USPage) },
      { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
];
