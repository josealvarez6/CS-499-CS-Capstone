import { Trip } from './trip';

// Stores pagination information returned by the API. This allows the Angular
// application to display page navigation and current paging status.
export interface Pagination {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

// Stores the search and filter values that were applied when retrieving the current
// results. Returning these values allows the interface to maintain the user's 
// selected filters.
export interface TripFilters {
    destination: string;
    minPrice: number | null;
    maxPrice: number | null;
    length: number | null;
    available: boolean | null;
    sort: string;
    order: string;
}

// Represents the complete response returned by the trip search endpoint, including
// the trip data, pagination information, and filters used.
export interface TripSearchResponse {
    success: boolean;
    trips: Trip[];
    pagination: Pagination;
    filters: TripFilters;
}