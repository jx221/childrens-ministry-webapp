import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        m => m.DashboardComponent
      )
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./features/inventory/inventory.component').then(
        m => m.InventoryComponent
      )
  },
  {
    path: 'incident-report',
    loadComponent: () =>
      import('./features/incident-report/incident-report.component').then(
        m => m.IncidentReportComponent
      )
  },
  {
    path: 'check-in-sheet',
    loadComponent: () =>
      import('./features/check-in-sheet/check-in-sheet.component').then(
        m => m.CheckInSheetComponent
      )
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
