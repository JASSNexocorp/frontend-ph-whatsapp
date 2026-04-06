import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/menu/pages/menu-page/menu-page.component').then(
        (m) => m.MenuPageComponent,
      ),
  },
];
