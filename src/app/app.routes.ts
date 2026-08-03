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
    path: 'schedule',
    loadComponent: () =>
      import('./features/schedule/schedule.component').then(
        m => m.ScheduleComponent
      )
  },

  {
    path: 'setup',
    loadComponent: () =>
      import('./features/setup/setup.component').then(
        m => m.SetupComponent
      )
  },

  {
    path: 'resources',
    loadComponent: () =>
      import('./features/resources/resources.component').then(
        m => m.ResourcesComponent
      )
  },

  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
