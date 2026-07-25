import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// FormsModule is required for the ngModule bindings used by
// the search and filter controls.
import { FormsModule } from '@angular/forms';

//import { trips } from '../data/trips';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data.service';

// Import the pagination model returned by the enhanced API>
import { Pagination } from '../models/trip-search-response';

import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [
    CommonModule,
    TripCardComponent,
    FormsModule
  ],
  templateUrl: './trip-listing.component.html',
  styleUrl: './trip-listing.component.css',
  providers: [TripDataService]
})

export class TripListingComponent implements OnInit {

  // Stores the current page of trips returned by the API.
  trips: Trip[] = [];

  // Displays information about the currentsearch results.
  message: string = '';

  // Displays API or network errors to the user.
  errorMessage: string = '';

  // Indicates whether a request is currently being processed.
  isLoading: boolean = false;

  // Search and filter values bound to the HTML controls.
  destination: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  tripLength: number | null = null;

  // The empty string represents no availability filter. The string
  // values are converted into booleans before they are sent to 
  // the service.
  availability: '' | 'true' | 'false' = '';

  // Sorting values sent to the backend API.
  sort: string = 'name';
  order: string = 'asc';

  // Number of trips requested on each page.
  pageSize: number = 6;

  // Stores pagination information returned by the API.
  pagination: Pagination = {
    currentPage: 1,
    pageSize: 6,
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false
  }

  constructor(
    private tripDataService: TripDataService,
    private router: Router,
    private authenticationService: AuthenticationService
  ) {
    console.log('trip-listing constructor');
  }

  // Navigates an authenticated administrator to the form used
  // to create a new trip.
  public addTrip(): void {
    this.router.navigate(['add-trip']);
  }

  // Converts the availability selection into the boolean value expected
  // by the TripDataService.
  private getAvailabilityValue(): boolean | undefined {
    if (this.availability === 'true') {
      return true;
    }

    if (this.availability === 'false') {
      return false;
    }

    return undefined;
  }

  // Retrieves trips using the current search, filter, sorting, and pagination selections..
  private loadTrips(page: number = 1): void {
    // clear previous messages before making a new request.
    this.errorMessage = '';
    this.isLoading = true;

    this.tripDataService.getTrips(
      // Do not send an empty destionation query parameter.
      this.destination.trim() || undefined,

      // convert null form values into undefined so omitted filters
      // are not added to the request.
      this.minPrice ?? undefined,
      this.maxPrice ?? undefined,
      this.tripLength ?? undefined,

      // convert the availability selection into a boolean.
      this.getAvailabilityValue(),

      this.sort,
      this.order,
      page,
      this.pageSize
    ).subscribe({
      next: (response) => {
        // Store the trips and pagination metadata returned by the enhanced
        // API response.
        this.trips = response.trips;
        this.pagination = response.pagination;

        // Display a result message based on the total number of matching trips,
        // not only the current page.
        if (response.pagination.totalItems > 0) {
          this.message = `${response.pagination.totalItems} trip` + 
          `${response.pagination.totalItems === 1 ? '' : 's'} found.`;
        } else {
          this.message = 'No trips matched the selected search criteria.';
        }

        this.isLoading = false;
        console.log(this.message);
      }, 

      error: (error) => {
        // Clear stale results when the request fails.
        this.trips = [];

        // Display the structured API message whe available.
        this.errorMessage = error?.error?.message ?? 'Unable to retrieve trips. Please try again.';
        this.message = '';
        this.isLoading = false;

        console.error('Unable to retrieve trips:', error);
      }
    });
  }

  // Applies the current filters and returns the user to the first page of results.
  public applyFilters(): void {
    this.loadTrips(1);
  }

  // Restores all controls to their default values and reloads the first page of trips.
  public resetFilters(): void {
    this.destination = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.tripLength = null;
    this.availability = '';
    this.sort = 'name';
    this.order = 'asc';
    this.pageSize = 6;

    this.loadTrips(1);
  }

  // Loads the previous page when one is available.
  public previousPage(): void {
    if (this.pagination.hasPreviousPage) {
      this.loadTrips(this.pagination.currentPage - 1);
    }
  }

  // Loads the next page when one is available.
  public nextPage(): void {
    if (this.pagination.hasNextPage) {
      this.loadTrips(this.pagination.currentPage + 1);
    }
  }

  // Reloads the first page when the number of results displayed per page changes.
  public changePageSize(): void {
    this.loadTrips(1);
  }

  // Loads the initial page of trips when the component starts.
  ngOnInit(): void {
    console.log('TripListing Component Initialized');
    this.loadTrips();
  }

  // Determines whether the administrator controls should be displayed.
  public isLoggedIn() {
    return this.authenticationService.isLoggedIn();
  }
}
