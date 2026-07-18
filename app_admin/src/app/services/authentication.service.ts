import { Inject, Injectable } from '@angular/core';
import { BROWSER_STORAGE } from '../storage';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { TripDataService } from './trip-data.service';

// Describes the data stored inside the JWT payload.
interface JwtPayload {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  // Setup our storage and service access
  constructor(
    @Inject (BROWSER_STORAGE) private storage: Storage,
    private tripDataService: TripDataService
  ) { }

  // Variable to handle Authetication Responses
  authResp: AuthResponse = new AuthResponse();

  // Get our token from our Storage provider.
  // NOTE: For this application we have decided that we will name
  // the key for our token 'travlr-token'
  public getToken(): string {
    let out: any;
    out = this.storage.getItem('travlr-token');

    // Make sure we return a string even if we don't have a token
    if(!out)
    {
      return '';
    }
    return out;
  }

  // Save our token to our Storage provider.
  // NOTE: For this application we have decided that we will name
  // the key for our token 'travlr-token'
  public saveToken(token: string): void {
    this.storage.setItem('travlr-token', token);
  }

  // Safely decodes the current JWT and returns its payload.
  // Invalid or malformed tokens return null instead of causing
  // the Angular application to crash.
  private decodeToken(): JwtPayload | null {
    const token = this.getToken();

    // Exit early if no token exists.
    if (!token) {
      return null;
    }

    try{
      // Split the JWT into its header, payload, and signature sections.
      const tokenParts = token.split('.');

      // Verify that the token contains three signature sections.
      if (tokenParts.length !== 3) {
        return null;
      }

      // Convert the URL-safe Base64 payload into standard Base64.
      const base64Url = tokenParts[1];
      const base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/');        
      
      // Add any required padding before decoding.
      const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      
      // Decode the payload into a readable JSON string.
      const decodedBytes = Uint8Array.from(atob(paddedBase64), character => character.charCodeAt(0));
      const decodedPayload = new TextDecoder().decode(decodedBytes);

      // Return the decoded payload as a strongly typed object.
      return JSON.parse(decodedPayload) as JwtPayload;

    } catch {
      // Return null if the token cannot be decoded successfully.
      return null;
    }
  }

  // Determines whether the stored JWT is missing, invalid, or
  // expired.
  public isTokenExpired(): boolean {
    const payload = this.decodeToken();

    // Treat missing or invalid payloads as expired.
    if (!payload || !payload.exp) {
      return true;
    }

    // Compare the token expiration time to the current time.
    return payload.exp <= (Date.now() / 1000);
  }

  // Logout of our application and remove the JWT from Storage
  public logout(): void {
    this.storage.removeItem('travlr-token');
  }

  // Boolean to determine if we are logged in and the token is
  // still valid. Even if we have a token we will still have to
  // reautheticate if the token has expired
  public isLoggedIn(): boolean {
    return  !this.isTokenExpired();
  }

  // Determines whether the authenticated user has permission to
  // access admin functionality.
  public isAdmin(): boolean {
    const payload = this.decodeToken();

    // Only autheticated users with admin role areauthorized
    return this.isLoggedIn() && payload?.role === 'admin';
  }

  // Provides a reusable authorization check for route guards and
  // administrative Angular components.
  public isAuthorized(): boolean {
    return this.isAdmin();
  }

  // Retrieve the current user. This function should only be called
  // after the calling method has checked to make sure that the user
  // isLoggedIn.
  public getCurrentUser(): User {
    const payload = this.decodeToken();
    const user = new User();

    // Return an empty user object if the token is invalid.
    if (!payload) {
      return user;
    }

    // Populate the user object using values from the JWT payload.
    user.email = payload.email;
    user.name = payload.name;
    user.role = payload.role;

    return user;
  }

  // Login method that leverages the login method in tripDataService
  // Because that method returns an observable, we subscribe to the
  // result and only process when the Observable condition is satisfied
  // Uncomment the tow console.log messages for additional debugging
  // information
  public login(user: User, passwd: string) : void {
    this.tripDataService.login(user, passwd)
      .subscribe({
        next: (value: any) => {
          if (value)
          {
            console.log(value);
            this.authResp = value;
            this.saveToken(this.authResp.token);
          }
        },
        error: (error: any) => {
          console.log('Error: ' + error);
        }
      })
  }

  // Register method that leverages the register method in
  // tripDataService
  // Becuase that method returns an observable, we subscribe to the
  // result and only process when the Observable condition is satisfied
  // Uncomment the two console.log messages for additional debugging
  // information. Please Note: This method is nearly identical to the
  // login method becuase the behavior of the API logs a new user in
  // immediately upon registration
  public register(user: User, passwd: string) : void {
    this.tripDataService.register(user, passwd)
      .subscribe({
        next: (value: any) => {
          if (value)
          {
            console.log(value);
            this.authResp = value;
            this.saveToken(this.authResp.token);
          }
        },
        error: (error: any) => {
          console.log('Error: ' + error);
        }
      })
  }
}
