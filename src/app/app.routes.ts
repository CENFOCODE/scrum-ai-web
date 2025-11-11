import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { AppLayoutComponent } from './components/app-layout/app-layout.component';
import { SigUpComponent } from './pages/auth/sign-up/signup.component';
import { UsersComponent } from './pages/users/users.component';
import { AuthGuard } from './guards/auth.guard';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { AdminRoleGuard } from './guards/admin-role.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { GuestGuard } from './guards/guest.guard';
import { IRoleType } from './interfaces';
import { ProfileComponent } from './pages/profile/profile.component';

import { GiftComponent } from './pages/gift/gift.component';
import { GiftListGiftsComponent } from './pages/gift-list-gifts/gift-list-gifts.component';
import { GiftsComponent } from './pages/gifts/gifts.component';
import { LandingCenfoComponent } from './pages/landing-cenfo/landing-cenfo.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { WebsocketTestComponent } from './components/websocketTest/websocketTestComponent';
import { VideoRoomComponent } from './components/videoRoom/videoRoom.component';
import { DailyComponent } from './pages/daily/daily.component';

import { ScenarioComponent } from './pages/scenario/scenario.component';


export const routes: Routes = [
  {
    path: 'landingpage',
    component: LandingPageComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'landingcenfo',
    component: LandingCenfoComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'signup',
    component: SigUpComponent,
    canActivate: [GuestGuard],
  },
    {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent,
  },

  {
    path: '',
    redirectTo: 'landingpage',
    pathMatch: 'full',
  },
  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'app',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate:[AdminRoleGuard],
        data: { 
          authorities: [
            IRoleType.admin, 
            IRoleType.superAdmin
          ],
          name: 'Users',
          showInSidebar: true
        }
      },
    

      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { 
          authorities: [
            IRoleType.admin, 
            IRoleType.superAdmin,
            IRoleType.user
          ],
          name: 'Dashboard',
          showInSidebar: true
        }
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: { 
          authorities: [
            IRoleType.admin, 
            IRoleType.superAdmin,
            IRoleType.user
          ],
          name: 'profile',
          showInSidebar: false
        }
      },
      {
        path: 'daily',
        component: DailyComponent,
        data: { 
          authorities: [
            IRoleType.superAdmin,
            IRoleType.user
          ],
          name: 'daily',
          showInSidebar: false
        }
      },
      
     
    
   
      
      {
        path: 'gift-list',
        component: GiftComponent,
        data: {
          authorities: [
            IRoleType.admin,
            IRoleType.superAdmin,
            IRoleType.user,
          ],
          name: 'Gift Lists',
          showInSidebar: true
        }
      },
      {
        path: 'gifts',
        component: GiftsComponent,
        data: {
          authorities: [
            IRoleType.admin,
            IRoleType.superAdmin,
            IRoleType.user,
          ],
          name: 'Gifts',
          showInSidebar: true
        }
      },
       {
        path: 'scenario',
        component: ScenarioComponent,
        data: {
          authorities: [
            IRoleType.admin,
            IRoleType.superAdmin,
            IRoleType.user,
          ],
          name: 'Scenario',
          showInSidebar: true
        }
      },
      {
        path: 'websocketTest',
        component: WebsocketTestComponent,
        data: { 
          authorities: [
            IRoleType.admin, 
            IRoleType.superAdmin,
            IRoleType.user,
          ],
          name: 'WebSocket Test',
          showInSidebar: false // si no querés que aparezca en el menú lateral
        }
      },
      {
        path: 'videoRoom',
        component: VideoRoomComponent,
        data: { 
          authorities: [
            IRoleType.admin, 
            IRoleType.superAdmin,
            IRoleType.user,
          ],
          name: 'Video Room',
          showInSidebar: false
        }
}


    ],
  },
];
