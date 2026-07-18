import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router
  ) { }

  // Determines whether the current user can access a protected route.
  public canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    // Redirect unauthenticated users to the login page.
    if (!this.authenticationService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });

      return false;
    }

    // Redirect authenticated users without the admin role to unauthorized page.
    if (!this.authenticationService.isAdmin()) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    // Allow authenticated administrators to access the route.
    return true;
  }
}