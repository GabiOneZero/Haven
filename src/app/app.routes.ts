import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./shared/navbar/navbar.routes').then((m) => m.routes),
  },
];
