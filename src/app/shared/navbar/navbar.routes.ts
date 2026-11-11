import type { Routes } from '@angular/router';

import { authenticatedGuard, guestGuard, landingGuard } from '../services/auth.guards';

import { NavbarPage } from './navbar.page';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('../../views/login/page/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    canActivate: [authenticatedGuard],
    component: NavbarPage,
    children: [
      { path: 'home', loadComponent: () => import('../../views/home/page/home.page').then((m) => m.HomePage) },
      {
        path: 'calendar',
        loadComponent: () => import('../../views/calendar/page/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'organize',
        loadComponent: () => import('../../views/organize/page/organize.page').then((m) => m.OrganizePage),
      },
      { path: 'us', loadComponent: () => import('../../views/us/page/us.page').then((m) => m.USPage) },
      { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
    ],
  },
  { path: '', canActivate: [landingGuard], pathMatch: 'full', children: [] },
];
