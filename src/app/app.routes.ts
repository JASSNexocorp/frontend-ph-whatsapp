import { Routes } from '@angular/router';

import { menuTokenValidoGuard } from './features/menu/utils/menu-token-valido.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'menu' },
  {
    path: 'menu',
    canActivate: [menuTokenValidoGuard],
    loadComponent: () =>
      import('./features/menu/pages/menu-page/menu-page.component').then(
        (m) => m.MenuPageComponent,
      ),
  },
  {
    path: 'link-expirado',
    loadComponent: () =>
      import(
        './features/expired-link/pages/expired-link-page/expired-link-page.component'
      ).then((m) => m.ExpiredLinkPageComponent),
  },
  { path: '**', redirectTo: 'menu' },
];
