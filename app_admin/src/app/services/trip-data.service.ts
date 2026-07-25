import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { BROWSER_STORAGE } from '../storage';

// Import the current application environment. This allows API
// endpoints to be configured without modifying source code.
import { environment } from '../../environments/environment'

// Import HttpParams so query-string parameters can be dynamically
// constructed before sending the requests.
import { HttpParams } from '@angular/common/http';

// Import the model representing the enhanced trip search response
// returned by the backend API.
import { TripSearchResponse } from '../models/trip-search-response';

import { Trip } from '../models/trip';

@Injectable({
  providedIn: 'root'
})

export class TripDataService {

  constructor(
    private http: HttpClient,
    @Inject(BROWSER_STORAGE) private storage: Storage
  ) { }

  // url = 'http://localhost:3000/api/trips';
  //baseUrl = 'http://localhost:3000/api';

  // Base API URL used throught the service.
  private readonly apiBaseUrl = environment.apiBaseUrl;
  // Endpoint used for all trip-related requests.
  private tripsUrl = `${this.apiBaseUrl}/trips`;

  //Retrieves trips using optional search criteria, filtering, sorting,
  // and pagination parameters. Any parameters not supported will use
  // their default values. 
  getTrips(
    destination?: string,
    minPrice?: number,
    maxPrice?: number,
    length?: number,
    available?: boolean,
    sort: string = 'name',
    order: string = 'asc',
    page: number = 1,
    limit: number = 6
  ): Observable<TripSearchResponse> {

    // Begin building the query-string parameters.
    // Sorting and pagination values are always included.
    let params = new HttpParams()
      .set('sort', sort)
      .set('order', order)
      .set('page', page)
      .set('limit', limit);

    // Add the destination filter if supplied.
    if (destination) {
      params = params.set('destination', destination);
    }

    // Add the minimum price filter if supplied.
    if (minPrice !== undefined) {
      params = params.set('minPrice', minPrice);
    }

    // Add the maximum price filter if supplied.
    if (maxPrice !== undefined) {
      params = params.set('maxPrice', maxPrice);
    }

    // Add the trip-length filter if supplied
    if (length !== undefined) {
      params = params.set('length', length);
    }

    // Add the availability filter if supplied.
    if (available !== undefined) {
      params = params.set('available', available);
    }

    // Send the completed request to the API and return the
    // enhanced search response.
    return this.http.get<TripSearchResponse>(
      this.tripsUrl,
      { params }
    );
  }

  addTrip(formData: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.tripsUrl, formData);
  }

  getTrip(tripCode: string): Observable<Trip[]> {
    // console.log('Inside TripDataService::getTrips');
    return this.http.get<Trip[]>(this.tripsUrl + '/' + tripCode);
  }

  updateTrip(formData: Trip): Observable<Trip> {
    // console.log('Inside TripDataService::addTrips');
    return this.http.put<Trip>(this.tripsUrl + '/' + formData.code, formData);
  }

  // Call to our /login endpoint, returns JWT
  login(user: User, passwd: string): Observable<AuthResponse> {
    // console.log('Inside TripDataService::login');
    return this.handleAuthAPICall('login', user, passwd);
  }

  // Call to our /register endpoint, creates user and returns JWT
  register(user: User, passwd: string): Observable<AuthResponse> {
    // console.log('Inside TripDataService::register');
    return this.handleAuthAPICall('register', user, passwd);
  }

  // helper method to process both login and register methods
  handleAuthAPICall(endpoint: string, user: User, passwd: string): Observable<AuthResponse> {
    // console.log('Inside TripDataService::handleAuthAPICall');
    let formData = {
      name: user.name,
      email: user.email,
      password: passwd
    };

    return this.http.post<AuthResponse>(this.apiBaseUrl + '/' + endpoint, formData);
  }
}