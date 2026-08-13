import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'assets',
        loadComponent: () => import('./features/assets/asset-list/asset-list.component').then(m => m.AssetListComponent)
      },
      {
        path: 'assets/create',
        loadComponent: () => import('./features/assets/asset-form/asset-form.component').then(m => m.AssetFormComponent),
        canActivate: [roleGuard],
        data: { allowedRoles: ['Administrator', 'Manager'] }
      },
      {
        path: 'assets/edit/:id',
        loadComponent: () => import('./features/assets/asset-form/asset-form.component').then(m => m.AssetFormComponent),
        canActivate: [roleGuard],
        data: { allowedRoles: ['Administrator', 'Manager'] }
      },
      {
        path: 'assets/detail/:id',
        loadComponent: () => import('./features/assets/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent)
      },
      {
        path: 'organization-units',
        loadComponent: () => import('./features/organization-units/org-unit-tree/org-unit-tree.component').then(m => m.OrgUnitTreeComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
